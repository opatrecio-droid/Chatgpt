/* 3G-cidade: v26 (lote 4-A) — pedidos dos moradores (4A.1) e cenas da cidade (4A.2). Simulação, sem DOM:
   a arte e as telas moram em 6C-ui-cidade.js. Estado novo: S.pedidos (inicialização preguiçosa, saves antigos funcionam). */
'use strict';
(function () {
  const Wd = G.W, clamp = G.clamp;

  /* ================= 4A.1 pedidos dos moradores ================= */
  /* Equilíbrio num só lugar (tempos em segundos do relógio do jogo; o relógio já respeita a velocidade). */
  G.PEDIDOS = {
    on: 1, max: 2,
    first: 150,           // primeiro pedido depois de tantos segundos jogados (e das 2 primeiras missões da Jornada: a apresentação é da Rosa)
    // Duas "pistas": A = entrega (sai do Armazém, dá para cumprir na hora); B = pedido demorado (feito, abate, forja, prazo). Cada pista tem no máximo 1 pedido ativo.
    cadA: [100, 155],     // intervalo entre um pedido de entrega e o seguinte
    cadB: [220, 340],     // idem para os demorados
    chainB: [110, 170],   // um demorado acabou (entregue, expirado ou falhado): outro vem mais cedo
    gap: 35,              // no máximo ~1 aviso por minuto na média (e nunca dois em menos de 35 s)
    grace: 90,            // tempo extra para entregar um pedido de "prazo cumprido" (cuidado)
    discPct: 25, discSecs: 600,   // desconto temporário no prédio do morador: 25% por 2 dias de jogo
  };
  const PD = G.PEDIDOS;

  G.pedidos = () => {
    const S = G.S;
    return S.pedidos || (S.pedidos = { nA: 0, nB: 0, last: -1e9, list: [], n: 0, x: 0, seq: 0, hist: [], disc: {}, who: {} });
  };
  const present = (name) => G.npcs.some((n) => n.name === name);
  const castOf = (name) => G.CAST.find((c) => c.name === name) || { name, job: 'Morador', at: null };
  const busyWho = () => { const o = {}; for (const r of G.pedidos().list) o[r.who] = 1; return o; };
  const pickWho = (names) => { const b = busyWho(), ok = names.filter((n) => present(n) && !b[n]); return ok.length ? G.pick(ok) : null; };

  /* zonas onde há herói caçando agora (o pedido de abates vai onde tem ação) */
  const huntZones = () => {
    const o = {};
    for (const h of G.S.heroes) if ((h.state === 'hunt' || h.state === 'travel') && h.zone && G.ZONE[h.zone] && G.zoneUnlocked(G.ZONE[h.zone])) o[h.zone] = (o[h.zone] || 0) + 1;
    const ks = Object.keys(o);
    return ks.length ? ks : G.ZONES.filter(G.zoneUnlocked).map((z) => z.id);
  };
  const zName = (id) => G.ZONE[id].name;
  const zIn = (id) => ({ bosque: 'no ', ruinas: 'nas ', ermos: 'nos ', pantano: 'no ', pico: 'no ', cinzas: 'nas ' }[id] || 'em ') + zName(id);

  /* ---- pedidos de entrega (saem do Armazém): [quem, recurso, fala] ---- */
  const RESQ = [
    ['Alda', 'trigo', 'Meu forno não espera. Trigo para o pão de hoje!'], ['Breno', 'trigo', 'A mó está parada por falta de grão.'],
    ['Joca', 'ervas', 'Algo roeu o canteiro. Preciso de ervas para replantar.'], ['Lina', 'madeira', 'Estacas novas para a cerca do trigal, por favor.'],
    ['Zeno', 'madeira', 'Armadilha boa pede madeira boa.'], ['Heitor', 'refeicao', 'Chegou gente de fora e a panela já está vazia.'],
    ['Iara', 'refeicao', 'Os caçadores voltaram com fome de dragão.'], ['Olívia', 'pocao', 'Curativo acaba rápido. Poções, se puder.'],
    ['Olívia', 'ervas', 'Para o unguento, ervas frescas. Muitas.'], ['Quim', 'ervas', 'Uma receita nova pede ervas, e pede muitas.'],
    ['Fábio', 'minerio', 'A bigorna está com sede de minério.'], ['Gilda', 'madeira', 'Cabos novos para as ferramentas: madeira, por favor.'],
    ['Nuno', 'trigo', 'Lenhador também come. Um pouco de trigo?'], ['Pedro', 'refeicao', 'Pedreira dá fome. Uma refeição quente me salva.'],
    ['Célia', 'pedra', 'Preciso de pedra para reforçar a barraca.'], ['Dário', 'trigo', 'A feira pediu trigo e eu pedi a você.'],
    ['Elga', 'madeira', 'Caixas novas para o caixa do mercado.'], ['Yara', 'ervas', 'Vou aprender a fazer chá. Ervas?'],
    ['Vasco', 'refeicao', 'Treino de manhã pede café reforçado.'], ['Úrsula', 'pocao', 'Guarda sem poção é guarda cansado.'],
    ['Tomé', 'trigo', 'Os cavalos pedem trigo. Eles são insistentes.'], ['Bento', 'pedra', 'Uma placa de pedra para o mural dos feitos.'],
    ['Rosa', 'madeira', 'O arquivo precisa de estantes novas.'], ['Soraia', 'pedra', 'Cofre pesa. Pedra para o reforço do porão.'],
    ['Nina', 'refeicao', 'Os hóspedes pedem café da manhã.'], ['Rui', 'madeira', 'Camas novas, madeira de lei.'],
  ];
  const MATQ = ['Quando chega {m}, a gente cria. Pode ajudar?', 'Preciso de {m} para uma encomenda.', 'Dizem que {m} está em alta. Eu ia aproveitar.', 'Falta {m} na minha bancada. Ajuda?'];
  const RAREQ = ['É coisa fina, só de elite e de chefe. {m}: consegue?', 'Pagaria bem por {m}. Sei que é difícil.', 'Um pouco de {m} e eu faço uma obra-prima.'];

  const resHave = (id) => Math.floor(G.S.res[id] || 0);
  /* quantidade pedida: uma fração do limite do Armazém, nunca mais que 25% do que há, e só de coisa que sobra (0 = não dá). Todo pedido de entrega pode ser atendido na hora e nunca deixa o reino sem o que precisa. */
  const resN = (id, f) => {
    const cap = G.resCap(id), meal = id === 'refeicao' || id === 'pocao', have = resHave(id);
    if (have < (meal ? 8 : 40)) return 0;
    const n = meal ? clamp(Math.round(cap * G.rnd(0.08, 0.16)), 2, 6) : Math.round(Math.min(cap, 2000) * G.rnd(f[0], f[1]));
    return Math.max(meal ? 2 : 8, Math.min(n, Math.floor(have * 0.25)));
  };
  const rarName = (r) => G.RAR[r].toLowerCase();

  /* ---- modelos: kind (res = sai do Armazém · cnt = contagem por evento ou estatística · time = prazo cumprido), peso, dureza, prazo, geração, texto ---- */
  const M = {};
  const def = (id, o) => { o.id = id; M[id] = o; return o; };
  const q1 = (arr) => G.pick(arr);

  def('entrega', { kind: 'res', hard: 0.8, dl: [110, 330], w: () => 3.2,
    mk: () => { const b = busyWho(), ok = RESQ.filter((e) => present(e[0]) && !b[e[0]] && G.RES[e[1]] && resN(e[1], [0.04, 0.09]) > 0); if (!ok.length) return null; const e = G.pick(ok); return { who: e[0], a: { res: e[1], q: e[2] }, n: resN(e[1], [0.04, 0.09]) }; },
    title: (r) => G.RES[r.a.res].name + ' ×' + G.fmt(r.n), quote: (r) => r.a.q });
  def('mat', { kind: 'res', hard: 1, dl: [130, 340], w: (c) => (c.zs.length ? 1.3 : 0),
    mk: (c) => { const who = pickWho(['Quim', 'Fábio', 'Gilda', 'Célia', 'Dário']); if (!who) return null; const z = G.pick(c.zs.slice(-3)), zm = G.ZMATS[z.n], id = Math.random() < 0.5 ? zm.a : zm.b, n = Math.min(Math.round((8 + 1.4 * c.L) * G.rnd(0.8, 1.2)), Math.floor(resHave(id) * 0.3)); return n >= 6 ? { who, a: { res: id, z: z.id }, n } : null; },
    title: (r) => G.RES[r.a.res].name + ' ×' + G.fmt(r.n),
    quote: (r) => q1(MATQ).replace('{m}', G.RES[r.a.res].name) });
  def('rara', { kind: 'res', hard: 1.5, dl: [200, 360], w: (c) => (c.zs.length >= 2 ? 0.9 : 0),
    mk: (c) => { const who = pickWho(['Quim', 'Fábio', 'Célia', 'Gilda']); if (!who) return null; const z = G.pick(c.zs.slice(-3)), id = G.ZMATS[z.n].r, n = Math.min(2 + (c.L >= 12 ? 1 : 0) + (c.L >= 24 ? 1 : 0), Math.floor(resHave(id) * 0.3)); return n >= 2 ? { who, a: { res: id, z: z.id }, n } : null; },
    title: (r) => G.RES[r.a.res].name + ' ×' + G.fmt(r.n), quote: (r) => q1(RAREQ).replace('{m}', G.RES[r.a.res].name) });
  def('forja_rar', { kind: 'cnt', ev: 'craft', hard: 1.2, dl: [220, 400], w: () => (G.bOk('ferraria') ? 1.3 : 0),
    mk: () => { const who = pickWho(['Fábio', 'Gilda', 'Célia', 'Soraia']); if (!who) return null; const L = G.bLvl('ferraria'); return { who, a: { rar: L < 5 ? 1 : 2 }, n: 1 }; },
    hit: (r, n, arg) => arg >= r.a.rar,
    title: (r) => 'Uma peça ' + rarName(r.a.rar) + ' ou melhor forjada',
    quote: (r) => q1(['Quero ver uma peça ' + rarName(r.a.rar) + ' sair da forja hoje. Só uma!', 'Dizem que a bigorna tem humor. Hoje eu queria uma peça ' + rarName(r.a.rar) + '.', 'Se sair uma peça ' + rarName(r.a.rar) + ', pendura na vitrine!']) });
  def('forja_n', { kind: 'cnt', ev: 'craft', hard: 0.8, dl: [180, 380], w: () => (G.bOk('ferraria') ? 1 : 0),
    mk: () => { const who = pickWho(['Gilda', 'Fábio', 'Vasco', 'Úrsula']); if (!who) return null; return { who, a: {}, n: Math.min(5, 2 + Math.floor(G.bLvl('ferraria') / 4)) }; },
    title: (r) => G.fmt(r.n) + ' peças forjadas', quote: (r) => q1(['Quero praticar: forje ' + r.n + ' peças hoje e eu aprendo olhando.', 'A forja quente rende. Que tal ' + r.n + ' peças novas?', 'Os heróis pedem equipamento. ' + r.n + ' peças dão conta.']) });
  def('abate', { kind: 'cnt', ev: 'kill', hard: 1, dl: [200, 400], w: (c) => (c.zs.length ? 1.4 : 0),
    mk: (c) => { const who = pickWho(['Zeno', 'Úrsula', 'Nuno', 'Joca', 'Vasco']); if (!who) return null; const z = G.pick(huntZones()); return { who, a: { z }, n: Math.round((10 + 3 * c.H + 0.8 * c.L) * G.rnd(0.85, 1.15)) }; },
    hit: (r, n, arg) => arg === r.a.z,
    title: (r) => G.fmt(r.n) + ' monstros abatidos ' + zIn(r.a.z),
    quote: (r) => q1(['Anda movimentado ' + zIn(r.a.z) + '. Limpem aquilo!', 'Ouvi rugidos ' + zIn(r.a.z) + '. Preciso de sossego.', 'Se os heróis derem conta de ' + r.n + ' ' + zIn(r.a.z) + ', durmo em paz.']) });
  def('elite', { kind: 'cnt', ev: 'elite', hard: 1.3, dl: [260, 440], w: (c) => (c.zs.length ? 1.3 : 0),
    mk: (c) => { const who = pickWho(['Bento', 'Úrsula', 'Vasco', 'Zeno']); if (!who) return null; const z = G.pick(huntZones()); return { who, a: { z }, n: clamp(2 + Math.floor(c.L / 8), 2, 5) }; },
    hit: (r, n, arg) => arg === r.a.z,
    title: (r) => G.fmt(r.n) + ' elites abatidos ' + zIn(r.a.z),
    quote: (r) => q1(['A Guilda quer ver ' + r.n + ' elites ' + zIn(r.a.z) + ' caírem. Os grandes, sabe?', 'Os brutamontes ' + zIn(r.a.z) + ' se acham donos do lugar. Mostrem o contrário.', r.n + ' elites ' + zIn(r.a.z) + ' e o mural dos feitos agradece.']) });
  def('chefe', { kind: 'cnt', ev: 'boss', hard: 1.6, dl: [260, 420], w: (c) => (c.L >= 3 ? 0.9 : 0),
    mk: () => { const who = pickWho(['Úrsula', 'Bento', 'Vasco']); if (!who) return null; return { who, a: {}, n: 1 }; },
    title: () => 'Um chefe derrotado', quote: () => q1(['Um chefe a menos e a cidade respira. Consegue?', 'Os vigias avistaram uma sombra grande. Que caiam os chefes!', 'Quando um chefe cai, a taverna enche. Faz isso por nós?']) });
  def('cuidado', { kind: 'time', ev: 'fall', hard: 1.1, dl: [150, 300], w: () => 1,
    mk: () => { const who = pickWho(['Olívia', 'Nina', 'Rui', 'Iara', 'Heitor']); if (!who) return null; return { who, a: {}, n: 1 }; },
    title: (r) => 'Ninguém cai até ' + r.dln, quote: () => q1(['Não quero ninguém na maca. Cuidem dos nossos até lá.', 'Prometa que todos voltam inteiros. Eu confio.', 'Maca vazia é a melhor notícia. Que seja assim!']) });
  def('refeicoes', { kind: 'cnt', stat: 'meals', hard: 0.8, dl: [240, 420], w: () => (G.bOk('taverna') ? 0.8 : 0),
    mk: (c) => { const who = pickWho(['Heitor', 'Iara']); if (!who) return null; return { who, a: {}, n: 2 + Math.floor(c.H * 0.3) }; },
    title: (r) => G.fmt(r.n) + ' refeições servidas na Taverna', quote: () => q1(['Quero ver a Taverna cheia: panela quente e barriga forte!', 'A cozinha está em ponto. Mandem os famintos!', 'Cheiro de ensopado atrai herói. Vamos ver quantos vêm?']) });
  def('pocoes', { kind: 'cnt', stat: 'potions', hard: 0.8, dl: [180, 360], w: () => (G.bOk('alquimista') ? 0.8 : 0),
    mk: (c) => { const who = pickWho(['Quim', 'Olívia']); if (!who) return null; return { who, a: {}, n: 2 + Math.floor(c.H * 0.5) }; },
    title: (r) => G.fmt(r.n) + ' poções bebidas em combate', quote: () => q1(['Quero saber se a minha última fornada rende. Que bebam!', 'Poção na mão do herói é poção bem gasta. Vamos conferir?', 'Uma poção bebida a tempo é um herói de pé.']) });
  def('vendas', { kind: 'cnt', ev: 'sold', hard: 0.9, dl: [180, 380], w: () => (G.bOk('ferraria') ? 0.9 : 0),
    mk: (c) => { const who = pickWho(['Célia', 'Dário', 'Elga', 'Gilda']); if (!who) return null; return { who, a: {}, n: 1 + (c.H > 5 ? 1 : 0) }; },
    title: (r) => G.fmt(r.n) + (r.n > 1 ? ' peças vendidas' : ' peça vendida') + ' aos heróis', quote: () => q1(['A vitrine está bonita. Falta um herói comprar.', 'Quando um herói compra, o comércio todo ri.', 'Equipamento vendido é o melhor anúncio. Vamos ver?']) });
  def('nivel', { kind: 'cnt', ev: 'lvl', hard: 0.9, dl: [180, 380], w: () => 1,
    mk: (c) => { const who = pickWho(['Vasco', 'Bento', 'Rosa']); if (!who) return null; return { who, a: {}, n: clamp(2 + Math.floor(c.H / 4), 2, 5) }; },
    title: (r) => 'Heróis sobem ' + r.n + ' níveis', quote: () => q1(['Quero ver gente crescer! Que os heróis subam de nível.', 'Cada nível novo é um orgulho. Mostrem o que treinaram.', 'A Guilda adora herói mais forte. Vamos ver subir?']) });
  def('contrato', { kind: 'cnt', stat: 'contracts', hard: 0.7, dl: [180, 380], w: () => (G.S.daily.list.some((x) => !x.claimed) ? 0.8 : 0),
    mk: () => { const who = pickWho(['Rosa', 'Soraia', 'Bento']); if (!who) return null; return { who, a: {}, n: 1 }; },
    title: () => 'Um contrato do dia concluído', quote: () => q1(['O quadro de contratos está cheio. Dê conta de um, por favor.', 'Palavra dada é palavra cumprida. Cumpra um contrato hoje.', 'Contrato feito é papel carimbado. Que tal um?']) });
  def('ouro', { kind: 'cnt', stat: 'goldIn', hard: 0.8, dl: [180, 380], w: () => 0.8,
    mk: (c) => { const who = pickWho(['Soraia', 'Célia', 'Dário', 'Elga']); if (!who) return null; const last = G.S.rep.last ? G.S.rep.last._in || 0 : 0; return { who, a: {}, n: Math.round(Math.max(G.taxEstimate() * 0.8, last * 0.5, 120 * G.PM(c.A)) / 10) * 10 }; },
    title: (r) => G.fmt(r.n) + ' moedas no cofre', quote: () => q1(['O cofre anda magro. Que entrem moedas!', 'Façam o ouro girar. Os números pedem.', 'Uma boa entrada de moedas e eu fecho o livro-caixa sorrindo.']) });
  def('arena', { kind: 'cnt', ev: 'duelo', hard: 1.2, dl: [220, 400], w: () => (G.arenaOpen && G.arenaOpen() && G.S.heroes.length >= 3 ? 1.2 : 0),
    mk: () => { const who = pickWho(['Úrsula', 'Vasco', 'Bento']); if (!who) return null; return { who, a: {}, n: 1 }; },
    hit: (r, n, arg) => arg === 1,
    title: () => 'Uma vitória na Arena', quote: () => q1(['Quero ver o brasão de Aurora erguido na Arena. Uma vitória!', 'Os reinos rivais riem. Hora de calar a risada.', 'Um duelo vencido vale mais que mil discursos.']) });
  def('colosso', { kind: 'cnt', ev: 'colosso', hard: 1.3, dl: [240, 420], w: () => (G.colossoLive && G.colossoLive() ? 1.3 : 0),
    mk: () => { const who = pickWho(['Bento', 'Úrsula', 'Vasco']); if (!who) return null; const co = G.S.colosso; if (!co || !co.hpMax) return null; return { who, a: { b: co.dmg || 0 }, n: Math.max(100, Math.round(co.hpMax * 0.035 / 100) * 100) }; },
    title: (r) => G.fmt(r.n) + ' de dano no Colosso', quote: () => q1(['O Colosso está de pé na Cratera. Que ele sinta cada golpe!', 'Cada pedaço do Colosso que cai é uma história pra contar.', 'Os vigias tremem com ele lá. Que ele trema mais!']) });
  def('obra', { kind: 'cnt', ev: 'build', hard: 0.9, dl: [200, 400], w: (c) => (c.L >= 2 ? 1 : 0),
    mk: () => { const who = pickWho(['Rosa', 'Soraia', 'Pedro', 'Nuno', 'Nina']); if (!who) return null; return { who, a: {}, n: 1 }; },
    title: () => 'Uma obra: erga ou melhore um prédio', quote: () => q1(['Aurora precisa crescer. Uma obra hoje seria ótima.', 'Cheiro de tinta fresca anima a cidade. Que tal uma obra?', 'Quando a cidade cresce, todo mundo trabalha. Um prédio melhorado já serve!']) });
  G.PEDIDO_MODELS = M;

  /* ---- prazo: marco do relógio do dia a que o pedido se refere ---- */
  const MARCOS = [[720, 'o meio-dia'], [1140, 'o anoitecer'], [0, 'a meia-noite'], [360, 'o amanhecer']];
  const dlPick = (rng) => {
    const c = G.S.clock, ok = [];
    for (const [m, nm] of MARCOS) {
      let rem = ((((m - c) % 1440) + 1440) % 1440) / G.MIN_PER_SEC;                // segundos de jogo até o marco
      if (rem < rng[0]) rem += G.DAY_SEC;
      if (rem <= rng[1] + 40) ok.push({ rem, nm });
    }
    return ok.length ? G.pick(ok) : { rem: rng[0] + 30, nm: 'o fim do dia' };
  };

  /* ---- recompensa: um pouco de moedas + um extra variado ---- */
  const rewardFor = (m, c, who) => {
    const hard = M[m].hard || 1, base = 50 * G.PM(c.A) * (1 + 0.05 * c.L);
    const rw = { gold: Math.round(base * 0.38 * hard * G.rnd(0.9, 1.1)), xp: 6 + c.L };
    const cast = castOf(who), canDisc = !!(cast.at && G.BLD[cast.at] && G.bLvl(cast.at) > 0 && G.bLvl(cast.at) < G.bMax(cast.at));
    const pk = G.wpick([['po', 22], ['animo', 16], ['desc', canDisc ? 16 : 0], ['nuc', 7 * hard], ['perg', G.RES.pergaminho ? 4 * hard : 0], ['selo', 1.5 * hard], ['ouro', 18]]);
    if (pk === 'po') rw.po = Math.max(3, Math.round((3 + 0.35 * c.L) * hard));
    else if (pk === 'animo') rw.animo = 1;
    else if (pk === 'desc') rw.desc = { id: cast.at, pct: hard >= 1.3 ? PD.discPct + 5 : PD.discPct, secs: PD.discSecs };
    else if (pk === 'nuc') rw.nuc = 1;
    else if (pk === 'perg') rw.perg = 1;
    else if (pk === 'selo') rw.selo = 1;
    else rw.gold = Math.round(rw.gold * 1.8);
    return rw;
  };
  G.pedidoRewardParts = (rw) => {
    const out = [];
    if (rw.gold) out.push({ ic: 'coin', t: G.fmt(rw.gold) + ' moedas' });
    if (rw.po) out.push({ ic: 'res', id: 'po_reforja', t: rw.po + ' Pó de Reforja' });
    if (rw.nuc) out.push({ ic: 'core', t: rw.nuc + ' Núcleo' });
    if (rw.selo) out.push({ ic: 'seal', t: rw.selo + ' Selo de Renome' });
    if (rw.perg) out.push({ ic: 'res', id: 'pergaminho', t: rw.perg + ' Pergaminho de Proteção' });
    if (rw.animo) out.push({ ic: 'smile', t: 'Ânimo da cidade em alta' });
    if (rw.desc) out.push({ ic: 'hammer', t: '−' + rw.desc.pct + '% em obras: ' + G.BLD[rw.desc.id].short + ' (2 dias)' });
    return out;
  };
  G.pedidoRewardText = (rw) => G.pedidoRewardParts(rw).map((x) => x.t).join(', ');

  /* ---- falas de agradecimento: cada morador tem as suas ---- */
  G.THANKS = {
    Rosa: ['Anotei no livro: Aurora lhe deve um favor.', 'Que registro bonito! Obrigada.'], Soraia: ['Contas fechadas. Que alívio!', 'Isso entra no livro-caixa com carinho.'],
    Bento: ['A Guilda não esquece quem ajuda.', 'Bom trabalho. Vai para o mural dos feitos.'], Nina: ['Os hóspedes agradecem. E eu também.', 'Que a sua cama seja sempre macia!'],
    Rui: ['Salvou o meu dia. Pode contar comigo.', 'Camas arrumadas e coração agradecido.'], Heitor: ['Esta rodada é por conta da casa!', 'Que o seu prato nunca fique vazio.'],
    Iara: ['Ufa! A cozinha respira de novo.', 'Guardei um pedaço de bolo para você.'], Olívia: ['Que a luz da Aurora cuide de você.', 'Cuidar de todos fica mais fácil assim.'],
    Fábio: ['Boa! A bigorna canta de novo.', 'Aço bom lembra de quem ajuda.'], Gilda: ['Uau, valeu mesmo! Já vou aprender com isso.', 'Prometo caprichar na próxima peça.'],
    Quim: ['Fascinante! Isso rende uma poção nova.', 'A ciência agradece, e o caldeirão também.'], Célia: ['Negócio fechado, e com sorriso.', 'Freguês assim eu atendo de portas abertas.'],
    Dário: ['Hoje a feira está em festa!', 'Leva uma maçã, é cortesia!'], Elga: ['Contei duas vezes: está certinho. Obrigada!', 'Caixa feliz, cidade feliz.'],
    Alda: ['O pão desta fornada é seu!', 'Que o forno nunca apague. Obrigada!'], Breno: ['A mó gira de novo. Valeu!', 'Farinha de primeira para você.'],
    Vasco: ['Disciplina e gratidão: é o que sobra.', 'Assim se forma uma tropa!'], Úrsula: ['Aurora dorme melhor com gente assim.', 'Anotado. Os portões agradecem.'],
    Joca: ['Que a colheita lhe seja farta!', 'As luas lhe paguem!'], Lina: ['Que alegria! O trigal vai brilhar.', 'Levo este favor no coração.'],
    Nuno: ['Madeira de lei, amigo de lei.', 'Eita, valeu! Corto uma lenha extra pra você.'], Pedro: ['Pedra sobre pedra, graças a você.', 'A mina canta! Obrigado!'],
    Yara: ['Aprendi muito com isso. Obrigada!', 'Posso ajudar na próxima também?'], Zeno: ['Boa caçada, amigo!', 'As feras que se cuidem. Valeu!'],
    Tomé: ['Os cavalos relincharam de gratidão.', 'Bom coração, bom casco. Valeu!'],
    _: ['Obrigado, de coração!', 'Aurora tem sorte de ter você.'],
  };
  G.pedidoThanks = (who) => G.pick(G.THANKS[who] || G.THANKS._);
  /* quando um pedido não dá certo (sem punição) */
  G.pedidoSorry = () => G.pick(['Tudo bem, fica para a próxima.', 'Sem problema. A cidade agradece a intenção.', 'Deixa pra lá, outro dia a gente tenta.']);

  /* ---- ciclo de vida ---- */
  G.pedidoOpen = () => { const S = G.S; return !!(PD.on && S && (G.HEADLESS || S.tut.done) && S.stats.played >= PD.first && (S.quest.step >= 2 || S.quest.done)); };
  G.pedidoSpawn = (lane, force) => {
    const S = G.S, P = G.pedidos(); if (P.list.length >= PD.max && !force) return null;
    lane = lane || 'a';
    const c = { S, L: S.realm.lvl, A: G.avgHeroLvl(), H: S.heroes.length, zs: G.ZONES.filter(G.zoneUnlocked) };
    const recent = P.hist.slice(-3).map((h) => h.m), act = P.list.map((r) => r.m);
    const slowOn = P.list.some((r) => M[r.m].kind !== 'res');
    const build = (inst) => {
      const pairs = [];
      for (const id in M) { if ((M[id].kind === 'res') !== inst) continue; const w = M[id].w(c) * (recent.indexOf(id) >= 0 ? 0.15 : 1) * (act.indexOf(id) >= 0 ? 0.05 : 1); if (w > 0) pairs.push([id, w]); }
      for (let tries = 0; tries < 8 && pairs.length; tries++) {
        const id = G.wpick(pairs), m = M[id], g = m.mk(c);
        if (g) return { id, m, g };
        const i = pairs.findIndex((p) => p[0] === id); if (i >= 0) pairs.splice(i, 1);
      }
      return null;
    };
    let pk = null;
    if (lane === 'a') pk = build(true) || (slowOn && !force ? null : build(false));      // sem entrega possível, a pista A aceita um demorado
    else if (!slowOn || force) pk = build(false);
    const nxt = (l) => (l === 'a' ? 'nA' : 'nB');
    if (!pk) { P[nxt(lane)] = S.t + 30; return null; }
    const { id, m, g } = pk, d = dlPick(m.dl), L = m.kind === 'res' ? 'a' : 'b';
    const r = { id: ++P.seq, m: id, who: g.who, lane: L, t0: S.t, dl: S.t + d.rem, dln: d.nm, a: g.a || {}, n: Math.max(1, g.n), p: 0, rw: rewardFor(id, c, g.who) };
    if (m.kind === 'time') { r.fin = r.dl; r.dl += PD.grace; }
    if (m.stat) r.a.b = S.stats[m.stat] || 0;
    r.q = m.quote(r);
    P.list.push(r); P.hist.push({ m: id, who: g.who, t: S.t }); if (P.hist.length > 12) P.hist.shift();
    P.last = S.t;
    if (L === 'a') P.nA = S.t + G.rnd(PD.cadA[0], PD.cadA[1]); else P.nB = S.t + G.rnd(PD.cadB[0], PD.cadB[1]);
    if (lane === 'a' && L === 'b') P.nB = Math.max(P.nB, S.t + 60);
    G.emit('pedido', { t: 'novo', r });
    return r;
  };
  G.pedidoOf = (who) => { const S = G.S; if (!S || !S.pedidos) return null; return S.pedidos.list.find((r) => r.who === who) || null; };
  G.pedidoGet = (id) => { const S = G.S; return S && S.pedidos ? S.pedidos.list.find((r) => r.id === +id) || null : null; };
  /* pronto para entregar? */
  G.pedidoReady = (r) => {
    const S = G.S, m = M[r.m];
    if (r.fail) return false;
    if (m.kind === 'res') return resHave(r.a.res) >= r.n;
    if (m.kind === 'time') return S.t >= r.fin;
    return r.p >= r.n;
  };
  /* leitura para as telas: progresso e tempo */
  G.pedidoInfo = (r) => {
    const S = G.S, m = M[r.m], c = castOf(r.who), ready = G.pedidoReady(r);
    let cur, n = r.n, unit = '';
    if (m.kind === 'res') { cur = Math.min(resHave(r.a.res), n); unit = 'no Armazém'; }
    else if (m.kind === 'time') { const tot = Math.max(1, r.fin - r.t0); cur = Math.round(clamp((S.t - r.t0) / tot, 0, 1) * 100); n = 100; unit = '% do prazo'; }
    else cur = Math.min(r.p, n);
    const left = Math.max(0, r.fail ? 0 : r.dl - S.t), tot = Math.max(1, r.dl - r.t0);
    return { r, m: m.id, kind: m.kind, who: r.who, job: c.job, at: c.at, title: m.title(r), quote: r.q, cur, n, unit, ready, left, pctLeft: clamp(left / tot, 0, 1), dln: r.dln, pct: n ? clamp(cur / n, 0, 1) : 0 };
  };
  G.pedidoText = (r) => r.who + ' · ' + M[r.m].title(r);
  const resolve = (r, how) => {
    const P = G.pedidos(), S = G.S, i = P.list.indexOf(r); if (i < 0) return;
    P.list.splice(i, 1);
    if (how !== 'entregue') P.x++;
    if (r.lane === 'b') P.nB = Math.min(P.nB, Math.max(S.t + G.rnd(PD.chainB[0], PD.chainB[1]), P.last + PD.gap));
  };
  G.pedidoDeliver = (id) => {
    const S = G.S, r = typeof id === 'object' ? id : G.pedidoGet(id); if (!r) return { err: 'Esse pedido já não existe.' };
    const m = M[r.m], P = G.pedidos();
    if (!G.pedidoReady(r)) return { err: m.kind === 'res' ? 'Faltam ' + G.fmt(r.n - resHave(r.a.res)) + ' ' + G.RES[r.a.res].name + ' no Armazém.' : 'Ainda não está cumprido.' };
    if (m.kind === 'res') G.addRes(r.a.res, -r.n);
    const rw = r.rw;
    if (rw.gold) G.earn(rw.gold, 'pedidos');
    if (rw.po) G.addRes('po_reforja', rw.po);
    if (rw.nuc) S.nucleos += rw.nuc;
    if (rw.selo) S.selos += rw.selo;
    if (rw.perg && G.RES.pergaminho) G.addRes('pergaminho', rw.perg);
    if (rw.animo) { S.happy = Math.min(100, (S.happy || 70) + 6); for (const h of S.heroes) h.animo = Math.min(100, h.animo + 20); }
    if (rw.desc) P.disc[rw.desc.id] = { pct: rw.desc.pct, until: S.t + rw.desc.secs };
    if (rw.xp) G.gainRealm(rw.xp);
    S.stats.pedidos = (S.stats.pedidos || 0) + 1; P.n++;
    P.who[r.who] = (P.who[r.who] || 0) + 1;
    const thanks = G.pedidoThanks(r.who), title = m.title(r);
    G.log('Pedido de ' + r.who + ' atendido (' + title + '): ' + G.pedidoRewardText(rw) + '.', 'good');
    resolve(r, 'entregue');
    G.emit('pedido', { t: 'entregue', r, who: r.who, title, thanks, rw, parts: G.pedidoRewardParts(rw) });
    return { ok: 1, r, thanks, rw };
  };
  const giveUp = (r, why) => {
    const sorry = G.pedidoSorry();
    G.log('O pedido de ' + r.who + ' (' + M[r.m].title(r) + ') ' + (why === 'falhou' ? 'não deu certo' : 'expirou') + '. Sem problema.', 'info');
    resolve(r, why);
    G.emit('pedido', { t: why, r, who: r.who, sorry });
  };

  /* ---- progresso por evento (envolve questEvent: kill, elite, boss, craft, sold, lvl, fall, build) ---- */
  let lastKillZ = null;
  G.pedidoNote = (k, n, arg) => {
    const S = G.S; if (!S || !S.pedidos || !S.pedidos.list.length) return;
    if (k === 'kill') lastKillZ = arg; else if (k === 'elite') arg = lastKillZ;
    for (const r of S.pedidos.list) {
      const m = M[r.m]; if (r.fail) continue;
      if (m.kind === 'time') { if (k === 'fall' && S.t < r.fin) r.fail = 1; continue; }
      if (m.ev !== k || r.p >= r.n) continue;
      if (m.hit && !m.hit(r, n, arg)) continue;
      r.p = Math.min(r.n, r.p + n);
    }
  };
  const qe0 = G.questEvent;
  G.questEvent = (k, n, arg) => { qe0(k, n, arg); G.pedidoNote(k, n, arg); };
  G.on('duelo', (d) => { G.pedidoNote('duelo', 1, d.win ? 1 : 0); });
  /* progresso por estatística (refeições, poções, contratos, moedas) e pelo dano ao Colosso */
  const pollP = (S) => {
    for (const r of S.pedidos.list) {
      const m = M[r.m]; if (r.fail) continue;
      if (m.stat) r.p = clamp((S.stats[m.stat] || 0) - r.a.b, 0, r.n);
      else if (m.ev === 'colosso') { const c = S.colosso; if (c) { if ((c.dmg || 0) < r.a.b) r.a.b = 0; r.p = clamp((c.dmg || 0) - r.a.b, 0, r.n); } }
    }
  };

  /* ---- relógio dos pedidos (1 Hz) ---- */
  const pedTick = () => {
    const S = G.S, P = S.pedidos;
    if (P && P.list.length) {
      pollP(S);
      for (const r of P.list.slice()) {
        if (r.fail) giveUp(r, 'falhou');
        else if (S.t >= r.dl) giveUp(r, 'expirou');
      }
    }
    if (!G.pedidoOpen() || S.mare.active) return;
    const Q = G.pedidos();
    if (!Q.nA) { Q.nA = S.t + 8; Q.nB = S.t + 70; }
    if (S.t - Q.last < PD.gap) return;
    if (Q.list.length < PD.max && S.t >= Q.nA && !Q.list.some((r) => r.lane === 'a')) { G.pedidoSpawn('a'); return; }
    if (Q.list.length < PD.max && S.t >= Q.nB && Q.nA - S.t > 40 && !Q.list.some((r) => r.lane === 'b')) G.pedidoSpawn('b');
  };

  /* ---- desconto temporário nas obras do prédio do morador ---- */
  const bc0 = G.bCost;
  G.bCost = (id, l) => {
    const c = bc0(id, l), S = G.S, d = S && S.pedidos && S.pedidos.disc[id];
    if (d && d.until > S.t) { const f = 1 - d.pct / 100; c.gold = Math.round(c.gold * f); for (const k in c.cost) c.cost[k] = Math.max(1, Math.round(c.cost[k] * f)); }
    return c;
  };
  G.pedidoDisc = (id) => { const S = G.S, d = S && S.pedidos && S.pedidos.disc[id]; return d && d.until > S.t ? d : null; };

  /* ---- próxima recompensa: os pedidos entram na fila do HUD ---- */
  const nr0 = G.nextReward;
  G.nextReward = () => {
    const r = nr0(), S = G.S;
    if (!S.pedidos || !S.pedidos.list.length) return r;
    for (const q of S.pedidos.list) {
      const i = G.pedidoInfo(q);
      r.all.push({ id: 'pd' + q.id, k: 'Pedido', t: i.ready ? q.who + ' · toque para entregar' : q.who + ' · ' + i.title, ic: 'scroll', cur: i.cur, n: i.n, pct: i.pct, rk: Math.min(0.99, i.pct * 0.8 + (1 - i.pctLeft) * 0.2), ready: i.ready, go: (i.ready ? 'pedidoent:' : 'pedido:') + q.id, pr: 1.2 });
    }
    const ready = r.all.filter((o) => o.ready).sort((a, b) => a.pr - b.pr);
    r.best = ready.length ? ready[0] : r.all.slice().sort((a, b) => b.rk - a.rk || a.pr - b.pr)[0] || null;
    return r;
  };

  /* ---- conquista: Vizinho de todos ---- */
  if (G.ACH && !G.ACH.some((a) => a.id === 'pedidos')) G.ACH.push({ id: 'pedidos', name: 'Vizinho de todos', stat: 'pedidos', tiers: [3, 12, 40, 120, 400, 1200], what: 'pedidos dos moradores atendidos' });

  /* ---- ganchos do laço do jogo ---- */
  let pT = 0;
  const tk0 = G.tick;
  G.tick = (dt) => {
    tk0(dt);
    const S = G.S; if (!S) return;
    pT -= dt; if (pT <= 0) { pT = 1; pedTick(); }
  };
  const reset = () => { pT = 0; lastKillZ = null; };
  const ng = G.newGame; G.newGame = () => { const S = ng(); reset(); return S; };
  const al = G.afterLoad; G.afterLoad = () => { al(); reset(); };

  /* @@fim3G-pedidos */
})();

(function () {
  /* ================= 4A.2 cenas da cidade (só com tela: não existem no simulador nem no save) =================
     Fogueira na praça (de noite), mesa na frente da Taverna (almoço e noite) e treino amistoso no Campo de Treino (de dia).
     Quem participa: heróis que já estavam na cidade (decisão de rotina ou parados na praça), moradores de folga e o visitante rival.
     Os heróis só entram se ganham algo com isso (descanso e ânimo) e saem depois de 25–45 s; nada aqui muda o ritmo do simulador. */
  const Wd = G.W;
  G.SCENE = {
    on: 1,
    stay: [14, 26],             // quanto tempo (s do jogo) um herói fica numa cena
    cd: 150,                    // depois de sair, nenhum herói entra em outra cena por tanto tempo
    joinP: 0.25,                // chance (por visita à cidade, sorteada no máximo a cada `roll` s) de um herói que acabou a rotina entrar na cena
    roll: 25, maxTotal: 3,      // no máximo 3 heróis em cenas ao mesmo tempo: a cidade ganha vida sem esvaziar a caçada
    fire: { x: 44, y: 57.55, rx: 2.5, ry: 1.4, seats: 6, maxH: 3, maxN: 3, dark: 0.3 },   // 6 lugares em volta (nunca um bem na frente: o fogo precisa aparecer)
    tav: { dx: 0.3, dy: 2.3, seats: 4, maxH: 2, maxN: 2 },   // mesa no pátio, bem em frente à porta da Taverna
    train: { hr: [7, 18.4], slots: 2 },
    chat: { every: [5, 9], dist: 3.3 },    // conversa entre moradores
  };
  const SC = G.SCENE;
  G.scenes = {};
  if (G.HEADLESS) { G.scenesInfo = () => ({}); return; }

  /* ---------- falas ---------- */
  const pk = (a) => a[Math.floor(Math.random() * a.length)];
  const FIRE_AIR = ['As duas luas estão lindas hoje.', 'Esse fogo esquenta até a alma.', 'Conta aquela do Ancião da Matilha!', 'Quem fica com a primeira ronda?', 'Nada como um fogo depois da caçada.', 'Alguém trouxe castanhas?', 'Hoje o Bosque estava inquieto…', 'Amanhã eu abato mais que todos vocês.', 'Se a Fenda rugir, eu ouço daqui.', 'Fogueira boa é fogueira cheia.', 'A noite em Aurora é outra coisa.', 'Escutem: nem um monstro ao longe.'];
  const TAV_AIR = ['Saúde!', 'À Aurora!', 'Esse hidromel é dos bons.', 'Mais uma rodada, por favor!', 'Quem paga a próxima?', 'Aqui se conta cada caçada duas vezes.', 'A taverna é o melhor posto avançado.', 'Um brinde a quem voltou inteiro!'];
  const TRAIN_AIR = ['Boa guarda!', 'Essa passou raspando!', 'De novo! Sem dó!', 'Você está lento hoje.', 'Ai! Isso foi de leve, é?', 'Mais firmeza no pulso!', 'Gostei desse giro.', 'Agora é pra valer… quase.'];
  const BOND = [null,
    ['Boa luta hoje, {b}.', '{b}, você luta bem.', 'Foi bom caçar ao seu lado, {b}.'],
    ['Ao seu lado eu não temo nada, {b}.', '{b}, te devo uma poção!', 'Fica comigo na próxima caçada, {b}?'],
    ['Irmão de armas! Um brinde, {b}!', '{b}, nunca largo a sua guarda.', 'Contigo, {b}, nem o Colosso me assusta.']];
  const BOND_OPP = ['{b}, você ainda deve uma revanche!', 'Amanhã eu abato mais que você, {b}.', 'Só vale se eu ganhar, {b}!', '{b}, vamos ver quem tem mais abates.'];
  const REPLY = ['Ha! Pode vir quando quiser, {a}.', 'Você fala muito, {a}.', 'Conte comigo, {a}.', 'Combinado!', 'Isso eu quero ver.', 'Brindo a isso!', '{a}, você é terrível. E meu amigo.', 'Só se você pagar a rodada, {a}.', 'Concordo, {a}.'];
  const NEM_L = ['Na próxima temporada, {ra} vai ver só!', '{RA} nos deve uma revanche. Eu cobro.', 'Um dia devolvo a derrota {rde}.', 'Cuidado: {ra} guarda rancor.'];
  const fillNem = (t, riv) => { const ra = G.rivArt(riv.name), de = G.rivArtDe(riv.name); return t.replace('{ra}', ra).replace('{RA}', ra[0].toUpperCase() + ra.slice(1)).replace('{rde}', de); };
  const NPC_L = {
    Heitor: ['Cerveja de gengibre pra quem quiser!', 'A casa serve, a casa lembra.'], Iara: ['Eu cuido das canecas, vocês da conversa.', 'Quem pediu o bolo de mel?'],
    Alda: ['Trouxe pão quentinho pra roda!', 'Sobrou da fornada. Podem pegar.'], Breno: ['A farinha de hoje estava perfeita.', 'Moinho parado, moleiro sentado.'],
    Joca: ['A lua cheia ajuda a colheita.', 'Amanhã o trigal vai estar lindo.'], Lina: ['As luas banham o trigal de prata.', 'Cansada, mas feliz.'],
    'Úrsula': ['Ronda tranquila. Por enquanto.', 'Fiquem de olho no portão sul.'], Vasco: ['Amanhã o treino começa cedo.', 'Quem foi bem hoje senta mais perto.'],
    'Olívia': ['Quem se machucou hoje fica comigo.', 'Chá de camomila para os valentes.'], Quim: ['Bebam devagar: a poção de hoje é nova.', 'Se brilhar no escuro, é normal.'],
    'Fábio': ['Aço bom vem do fogo, como a prosa.', 'Hoje a forja descansa. Eu, não.'], Gilda: ['Um dia faço uma espada lendária.', 'O Fábio disse que eu estou indo bem!'],
    'Célia': ['Contei o caixa duas vezes. Dia bom!', 'A feira de amanhã vai ser grande.'], 'Dário': ['Maçãs, quem quer maçãs?', 'Vendi tudo. Primeira vez este mês!'],
    Elga: ['O caixa fechou redondinho.', 'Troco certo, amizade longa.'], Nina: ['As camas estão prontas, se alguém quiser.', 'Hoje a hospedaria está cheia de sonhos.'],
    Rui: ['Quem ronca paga multa. Brincadeira!', 'Deixei a lamparina acesa na entrada.'], Soraia: ['Fim de mês chega logo.', 'Quem deve ao cofre, deve a Aurora.'],
    Rosa: ['Registrei os feitos de hoje.', 'Alguém quer ouvir a crônica do dia?'], Bento: ['Aurora tem bons caçadores.', 'Lembrem: contrato é coisa sagrada.'],
    Nuno: ['Cortei lenha para a noite toda.', 'O fogo está bonito, hein?'], Pedro: ['A pedra me deixou com sede.', 'Hoje achei um veio bonito.'],
    Yara: ['Posso ouvir as histórias também?', 'Eu aprendo tanto aqui.'], Zeno: ['Ouvi um lobo uivar ao longe.', 'Amanhã eu pego aquele javali.'],
    'Tomé': ['Os cavalos dormem cedo. Eu fico.', 'Trouxe cenouras para os cavalos dos heróis.'],
    _: ['Que noite bonita.', 'Gosto de ouvir as histórias dos caçadores.'],
  };
  /* conversas entre dois moradores (2 ou 3 falas), por par de nomes; as sem par ficam em CHAT_ANY */
  const CHAT = {
    'Alda|Breno': ['Esse pão saiu bem, hein?', 'Segredo da Alda: paciência e fermento.', 'E um pouquinho de teimosia.'],
    'Fábio|Gilda': ['Mais fundo na têmpera, Gilda.', 'Assim, mestre? Sem queimar o pulso?', 'Quase. Daqui a pouco você me passa.'],
    'Joca|Lina': ['O trigal está pedindo chuva.', 'Pede, mas a lua cheia promete bom tempo.', 'Então eu aposto na lua.'],
    'Heitor|Iara': ['Quantas canecas hoje, Iara?', 'Perdi a conta. A casa estava cheia!', 'Esse é o tipo de problema que eu gosto.'],
    'Nina|Rui': ['Tem hóspede novo na ala sul.', 'Já ronca? Então é cliente antigo.', 'Ha! Vai ver que sim.'],
    'Célia|Dário': ['Vendeu bem hoje, Dário?', 'Maçãs voaram. E você?', 'Tecido e sorrisos. Dia bom.'],
    'Olívia|Quim': ['A sua poção cheira a hortelã?', 'Cheira a hortelã e a segredo.', 'Eu só quero que cure, tá?'],
    'Úrsula|Vasco': ['Quem passa hoje na minha ronda?', 'Os novatos, se aguentarem o treino.', 'Então a ronda será longa.'],
    'Bento|Rosa': ['Os feitos de hoje já estão no livro?', 'Todos, até os mais modestos.', 'Os modestos são os que me interessam.'],
    'Nuno|Pedro': ['Lenha e pedra: a cidade se faz com a gente.', 'E com paciência. Muita.', 'Muita mesmo.'],
    'Soraia|Elga': ['O cofre fechou no azul.', 'Meu caixa também. Estranho, né?', 'Sorte rara. Vamos aproveitar.'],
    'Yara|Zeno': ['Você já viu um javali de perto?', 'Vi. Ele me viu também. Corri.', 'Então quero ser caçadora como você.'],
  };
  const CHAT_ANY = [
    ['Viu os heróis voltando carregados?', 'Vi! A bolsa estava mais pesada que o dono.', 'Pelo menos o armazém agradece.'],
    ['Dia movimentado, hein?', 'Aurora nunca dorme direito.', 'É o preço de ter heróis.'],
    ['Ouvi falar da Arena…', 'Dizem que nossos heróis vão bem.', 'Que continuem. Me dão orgulho.'],
    ['Preciso descansar esses pés.', 'Senta aí. O banco é de todos.', 'Já estou sentando!'],
    ['As luas estão bonitas hoje.', 'Duas luas, duas vezes mais sorte.', 'Que seja verdade!'],
    ['Sentiu o cheiro do pão da Alda?', 'Senti a quarteirões!', 'Esse cheiro vale ouro.'],
    ['Tem boato de Colosso lá na Cratera.', 'Dizem que o chão treme.', 'Melhor nossos heróis do que eu.'],
    ['Amanhã vai ser um bom dia.', 'Todo dia é, quando a cidade cresce.', 'Falou bonito.'],
  ];

  /* ---------- utilidades ---------- */
  const S_ = () => G.S;
  const isHero = (e) => !!e && e.cls !== undefined && !e.vis;
  const heroOk = (h) => { const S = S_(), st = G.heroStats(h); return !h.inside && !h._sc && h.state !== 'fallen' && h.state !== 'recover' && h.hp >= st.hp * 0.7 && h.fome >= 40 && h.energia >= 35 && S.t >= (h._scCd || 0) && !S.mare.active && !(S.ev.curfew > S.t); };
  const needs = (h) => h.energia < 80 || h.animo < 85;                       // só entra quem ganha algo (descanso, ânimo)
  const say = (e, t, sec) => { if (!e || e.sayT > 0) return false; e.say = t; e.sayT = sec || 3.6; return true; };
  const npcByName = (n) => G.npcs.find((x) => x.name === n) || null;
  const hr = () => (S_().clock / 60) % 24;

  /* ---------- criação das cenas ---------- */
  const mkSeats = (pts, dirTo, sit) => pts.map((p) => ({ x: p[0], y: p[1], dir: dirTo >= p[0] ? 1 : -1, sit: sit ? 1 : 0, e: null }));
  const snap = (p) => (Wd.walkable(p[0], p[1]) ? p : Wd.nearestWalk(p[0], p[1]));
  const mkFire = () => {
    const c = SC.fire, pts = [];
    for (const deg of [180, 0, -135, -45, 135, 45]) { const a = (deg * Math.PI) / 180; pts.push(snap([c.x + Math.cos(a) * c.rx, c.y + Math.sin(a) * c.ry])); }
    return { k: 'fire', x: c.x, y: c.y, seats: pts.map((p) => ({ x: p[0], y: p[1], dir: c.x >= p[0] ? 1 : -1, sit: 1, e: null })), q: [], cdT: 3, t0: S_().t, maxH: c.maxH, maxN: c.maxN };
  };
  const mkTav = () => {
    const d = Wd.door('taverna'), c = SC.tav, tx = d[0] + c.dx, ty = d[1] + c.dy;
    const seats = [[tx - 1.75, ty + 0.1, 1], [tx + 1.75, ty + 0.1, -1], [tx - 0.55, ty - 1.0, 1], [tx + 0.55, ty + 1.1, -1]].map((p) => { const q = snap(p); return { x: q[0], y: q[1], dir: p[2], sit: 1, e: null }; });
    return { k: 'tav', x: tx, y: ty, seats, q: [], cdT: 3, t0: S_().t, maxH: c.maxH, maxN: c.maxN };
  };
  const mkTrain = () => {
    const d = Wd.door('treino'), y = d[1] - 1.7;          // dentro do pátio cercado: entram pela porta e treinam entre os bonecos
    return { k: 'train', x: d[0], y, seats: [{ x: d[0] - 0.95, y, dir: 1, sit: 0, e: null }, { x: d[0] + 0.95, y, dir: -1, sit: 0, e: null }], q: [], cdT: 3, t0: S_().t, maxH: 2, maxN: 1, hit: 1 };
  };
  const MK = { fire: mkFire, tav: mkTav, train: mkTrain };
  const wanted = (k) => {
    const S = S_(); if (S.mare.active || !S.tut.done) return false;
    const h = hr();
    if (k === 'fire') return G.darkness(S.clock) >= SC.fire.dark;
    if (k === 'tav') return G.bOk('taverna') && ((h >= 11.5 && h < 13.5) || h >= 17.5 || h < 1.5);
    if (k === 'train') return G.bOk('treino') && h >= SC.train.hr[0] && h < SC.train.hr[1];
    return false;
  };

  /* ---------- ocupantes ---------- */
  const occ = (sc) => sc.seats.filter((s) => s.e).map((s) => s.e);
  const nHeroes = (sc) => sc.seats.filter((s) => s.e && isHero(s.e)).length;
  const nNpcs = (sc) => sc.seats.filter((s) => s.e && !isHero(s.e) && !s.e.vis).length;
  const freeSeat = (sc, e) => { let best = null, bd = 1e9; for (const s of sc.seats) { if (s.e) continue; const d = Math.hypot(s.x - e.x, s.y - e.y); if (d < bd) { bd = d; best = s; } } return best; };
  const release = (sc, s, why) => {
    const e = s.e; if (!e) return; s.e = null;
    e._sc = null; e._seat = null; e._sit = 0;
    if (isHero(e)) { e._scCd = S_().t + SC.cd; e.until = 0; }
    else if (e.vis) { /* o visitante segue o plano dele */ }
    else { e.tThink = 0; e.act = ''; e.state = 'walk'; e.path = null; e.moving = false; }
    void why;
  };
  const join = (sc, s, e) => {
    const S = S_(); s.e = e; e._sc = sc.k; e._seat = s; e._sit = 0;
    if (isHero(e)) {
      e.state = 'idle'; e._scEnd = S.t + G.rnd(SC.stay[0], SC.stay[1]); e.until = e._scEnd + 4; e.tgt = null; G.go(e, s.x, s.y);
      if (!e.path || (!e.path.length && Math.hypot(e.x - s.x, e.y - s.y) > 0.7)) { release(sc, s, 'sem caminho'); e._scCd = S.t + 20; return false; }
    } else {
      e.inside = false; e.state = 'walk'; e.moving = true; e._scEnd = S.t + G.rnd(SC.stay[0] + 20, SC.stay[1] + 40);
      G.go(e, s.x, s.y); if (!e.path) e.path = [];
    }
    if (sc.k === 'train' && e.path) e.path.push([s.x, s.y]);       // o pátio não é "andável" no mapa: o último trecho entra pela porta
    return true;
  };
  const dissolve = (k) => { const sc = G.scenes[k]; if (!sc) return; for (const s of sc.seats) release(sc, s, 'fim'); delete G.scenes[k]; };

  /* ---------- o robô da cena (0,5 s) ---------- */
  const vigias = ['Úrsula', 'Rui', 'Heitor', 'Zeno', 'Vasco', 'Nina'];
  const recruit = (sc) => {
    const S = S_(), c = sc.k;
    /* heróis parados na praça (sem zona segura, toque de recolher…): entram sem sorteio */
    for (const h of S.heroes) {
      if (nHeroes(sc) >= sc.maxH) break;
      if (h.state !== 'idle' || !heroOk(h)) continue;
      const s = freeSeat(sc, h); if (s) join(sc, s, h);
    }
    /* moradores de folga */
    if (c === 'fire' || c === 'tav') {
      const hh = hr();
      for (const n of G.npcs) {
        if (nNpcs(sc) >= sc.maxN) break;
        if (n._sc || n.inside || n.guard) continue;
        const free = (c === 'fire' ? hh >= 19.25 && hh < 22 && n.act === 'leisure' : n.act === 'leisure' || n.act === 'lunch') && (n.state === 'stand' || n.state === 'walk' || n.state === 'toil') && Math.random() < 0.25;
        if (!free) continue;
        const s = freeSeat(sc, n); if (s) join(sc, s, n);
      }
      if (c === 'fire' && !sc.seats.some((s) => s.e && s.e._vig) && (hh >= 21.5 || hh < 5)) {      // a madrugada tem sempre um vigia na fogueira
        for (const nm of vigias) {
          const n = npcByName(nm); if (!n || n._sc) continue;
          const s = freeSeat(sc, n); if (!s) break;
          n._vig = 1; n.inside = false; join(sc, s, n); n._scEnd = S.t + 1e6; break;
        }
      }
    }
    if (c === 'train') {
      const v = npcByName('Vasco'), sl = sc.seats;
      if (v && !v._sc && !v.inside && sl.filter((s) => s.e).length === 1 && S.t - (sc.lone || S.t) > 7) { const s = freeSeat(sc, v); if (s) { join(sc, s, v); v._scEnd = S.t + 22; } }
    }
    /* o visitante rival entra na cena da fogueira ou da taverna */
    const v = G.visitor;
    if (v && !v.gone && v.state !== 'leave' && !v._sc && (c === 'fire' || c === 'tav') && Math.random() < 0.5) {
      const s = freeSeat(sc, v);
      if (s) { s.e = v; v._sc = c; v._seat = s; const stop = { p: [s.x, s.y], dwell: G.rnd(20, 30), what: c === 'fire' ? 'fogueira' : 'taverna' }; v.plan.splice(v.step + 1, 0, stop); v.until = Math.min(v.until || 1e9, v.t + 2); }
    }
  };
  const validate = (sc) => {
    const S = S_();
    for (const s of sc.seats) {
      const e = s.e; if (!e) continue;
      if (isHero(e)) {
        const st = G.heroStats(e);
        if (e.state !== 'idle' || e._seat !== s || S.mare.active) { s.e = null; e._sc = null; e._seat = null; e._sit = 0; e._scCd = S.t + SC.cd; continue; }
        if (S.t >= e._scEnd || e.fome < 22 || e.hp < st.hp * 0.55) release(sc, s, 'fim');
      } else if (e.vis) {
        if (e.gone || e.state === 'leave' || G.visitor !== e || e.t > e.life) { s.e = null; e._sc = null; e._seat = null; }
        else if (e.state === 'stand' && Math.hypot(e.x - s.x, e.y - s.y) < 1.2) { e.dir = sc.x >= e.x ? 1 : -1; }
      } else if (S.mare.active || (!e._vig && S.t >= e._scEnd) || (sc.k === 'fire' && !e._vig && (hr() >= 22 || hr() < 5)) || (e._vig && G.darkness(S.clock) < SC.fire.dark - 0.05)) release(sc, s, 'fim');
    }
  };
  /* heróis e moradores sentados recebem os efeitos da cena; quem chegou ao lugar senta (ou fica de pé, no treino) */
  const upd = (sc, dt) => {
    const S = S_();
    for (const s of sc.seats) {
      const e = s.e; if (!e || e.vis) continue;
      if (!isHero(e)) {
        if (e.sayT > 0) e.sayT -= dt;
        if (e.path && e.path.length) { G.step(e, dt, e.spd); e.moving = true; }
        else { e.moving = false; }
      }
      const arrived = !(e.path && e.path.length) && Math.hypot(e.x - s.x, e.y - s.y) < 0.9;
      if (arrived) {
        e._sit = s.sit; e.dir = s.dir; e.moving = false;
        if (isHero(e)) {
          if (sc.k === 'fire' || sc.k === 'tav') { e.animo = Math.min(100, e.animo + dt * 0.9); e.energia = Math.min(100, e.energia + dt * (sc.k === 'fire' ? 0.6 : 0.25)); if (sc.k === 'tav') e.fome = Math.min(100, e.fome + dt * 0.5); }
        }
      } else if (!isHero(e) && !(e.path && e.path.length)) { e.path = null; }
    }
    void S;
  };

  /* ---------- falas da cena ---------- */
  const heroLine = (a, b, sc) => {
    const S = S_(), r = Math.random(), bh = isHero(b);
    if (bh) {
      const l = G.laco ? G.laco(a, b) : null;
      if (l && l.lv >= 1 && r < 0.4) return pk(l.opp ? BOND_OPP : BOND[l.lv]).replace('{b}', b.name);
      const tb = G.titleOf && G.titleOf(b);
      if (tb && r < 0.58) return tb.id === 'vingador' ? 'Brindemos ao Vingador, ' + b.name + '!' : 'Um brinde a ' + b.name + ', “' + tb.name + '”!';
      const f = b.feitos && b.feitos.tl && b.feitos.tl[b.feitos.tl.length - 1];
      if (f && r < 0.72 && S.day - f.d <= 2 && f.t.length <= 34 && !/^(o Livro|chegou|foi )/.test(f.t)) return 'Contam que ' + b.name + ' ' + f.t + '!';
    }
    const ta = G.titleOf && G.titleOf(a);
    if (ta && r > 0.9) return 'Dizem que sou “' + ta.name + '”. Só queria a sopa.';
    const nem = G.nemesis && G.nemesis();
    if (nem && r > 0.74) return fillNem(pk(NEM_L), nem.riv);
    return pk(sc.k === 'tav' ? TAV_AIR : sc.k === 'train' ? TRAIN_AIR : FIRE_AIR);
  };
  const npcLine = (n) => pk(NPC_L[n.name] || NPC_L._);
  const lineOf = (a, b, sc) => (isHero(a) ? heroLine(a, b, sc) : npcLine(a));
  const reply = (b, a) => (isHero(b) ? pk(REPLY).replace('{a}', a.name) : pk(['Ha! Boa, ' + a.name + '.', 'É isso aí!', 'Verdade verdadeira.', 'Brindo a isso.']));
  const talk = (sc, dt) => {
    for (let i = sc.q.length - 1; i >= 0; i--) { const t = sc.q[i]; t.t -= dt; if (t.t <= 0) { sc.q.splice(i, 1); if (t.e._sc === sc.k || t.e.vis) say(t.e, t.text, 3.4); } }
    sc.cdT -= dt; if (sc.cdT > 0 || sc.q.length) return;
    const arrived = sc.seats.map((s) => s.e).filter((e) => e && !e.vis && !(e.path && e.path.length) && e.sayT <= 0 && Math.hypot(e.x - e._seat.x, e.y - e._seat.y) < 0.9);
    const all = occ(sc);
    if (arrived.length < 1 || all.length < 2) { sc.cdT = 2; return; }
    const a = pk(arrived), others = all.filter((e) => e !== a), b = pk(others);
    const line = lineOf(a, b, sc);
    sc.q.push({ t: 0.05, e: a, text: line });
    if (!b.vis && b.sayT <= 0 && Math.random() < 0.8) sc.q.push({ t: 2.7, e: b, text: reply(b, a) });
    if (Math.random() < 0.35 && !b.vis) sc.q.push({ t: 5.4, e: a, text: pk(['Ha ha ha!', 'É por isso que eu gosto daqui.', 'Obrigado pela companhia.', 'Anotado para amanhã.']) });
    sc.cdT = G.rnd(9, 15);
  };
  /* treino amistoso: de tempos em tempos um dá o golpe e o outro leva, tudo de leve (sem dano nenhum) */
  const spar = (sc, dt) => {
    const a = sc.seats[0].e, b = sc.seats[1].e;
    if (!a || !b) { if (!sc.lone && (a || b)) sc.lone = S_().t; if (!a && !b) sc.lone = 0; return; }
    sc.lone = 0;
    const ok = (e, s) => !(e.path && e.path.length) && Math.hypot(e.x - s.x, e.y - s.y) < 0.9;
    if (!ok(a, sc.seats[0]) || !ok(b, sc.seats[1])) return;
    sc.hitT = (sc.hitT || 0) - dt; if (sc.hitT > 0) return;
    sc.hitT = G.rnd(0.85, 1.35); sc.hit = 1 - sc.hit;
    const at = sc.hit ? a : b, df = sc.hit ? b : a;
    at.swing = 0.28; at.dir = df.x >= at.x ? 1 : -1; df.flash = 0.1; df.dir = at.x >= df.x ? 1 : -1;
    G.addFx({ t: 'slash', x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 0.5, dir: at.dir, c: '#f2ecd6' });
    if (Math.random() < 0.3) G.addFx({ t: 'text', x: df.x, y: df.y - 1.4, s: pk(['toc!', 'clang!', 'tum!']), c: '#e8e0c0' });
  };

  /* ---------- conversa entre moradores (fora das cenas) ---------- */
  let chT = 4;
  const chat = () => {
    const S = S_(), c = SC.chat; if (S.mare.active || S.opts.lowFx) return;
    const ok = G.npcs.filter((n) => !n.inside && !n._sc && !n.guard && n.sayT <= 0 && !n.talk && (n.state === 'stand' || n.state === 'toil') && !G.pedidoOf(n.name));
    for (let i = 0; i < ok.length; i++) for (let j = i + 1; j < ok.length; j++) {
      const a = ok[i], b = ok[j]; if (Math.hypot(a.x - b.x, a.y - b.y) > c.dist) continue;
      const k1 = a.name + '|' + b.name, k2 = b.name + '|' + a.name, flip = !CHAT[k1] && !!CHAT[k2], ex = CHAT[k1] || CHAT[k2] || pk(CHAT_ANY);
      const x = flip ? b : a, y = flip ? a : b;
      a.talk = b.talk = 1; a.dir = b.x >= a.x ? 1 : -1; b.dir = a.x >= b.x ? 1 : -1;
      a.until = Math.max(a.until || 0, S.t + 14); b.until = Math.max(b.until || 0, S.t + 14);
      ex.forEach((t, k) => { setTimeout(() => { const sp = k % 2 ? y : x; if (G.S === S && !sp._sc && !sp.inside) { sp.say = t; sp.sayT = 3.6; } if (k === ex.length - 1) { a.talk = b.talk = 0; } }, 80 + k * 3000); });
      return;
    }
  };

  /* ---------- laço da cena (cada quadro; a parte pesada, a cada 0,5 s) ---------- */
  let acc = 0;
  const tickScenes = (dt) => {
    const S = S_(); if (!SC.on || !S) return;
    for (const k in G.scenes) { const sc = G.scenes[k]; upd(sc, dt); talk(sc, dt); if (k === 'train') spar(sc, dt); }
    acc += dt; if (acc < 0.5) return; const step = acc; acc = 0;
    void step;
    for (const k of ['fire', 'tav', 'train']) {
      const w = wanted(k), sc = G.scenes[k];
      if (w && !sc) { try { G.scenes[k] = MK[k](); } catch (e) { /* sem prédio: sem cena */ } }
      else if (!w && sc) dissolve(k);
    }
    for (const k in G.scenes) { const sc = G.scenes[k]; validate(sc); recruit(sc); }
    chT -= 0.5; if (chT <= 0) { chT = G.rnd(SC.chat.every[0], SC.chat.every[1]); chat(); }
  };
  /* herói que acabou a rotina na cidade decide: se há lugar numa cena e ele ganha algo, entra */
  const hd0 = G.heroDecide;
  G.heroDecide = (h) => {
    const S = S_(), total = () => { let n = 0; for (const k in G.scenes) n += nHeroes(G.scenes[k]); return n; };
    if (SC.on && !G.OFFLINE && G.scenes && heroOk(h) && h.bagN === 0 && S.t - (h._scT || -1e9) >= SC.roll && (h._scT = S.t) && Math.random() < SC.joinP && total() < SC.maxTotal) {
      const prefer = h.act === 'eat' ? ['tav', 'fire', 'train'] : h.act === 'train' ? ['train', 'fire', 'tav'] : ['fire', 'tav', 'train'];
      if (needs(h) || h.act === 'train') for (const k of prefer) {
        const sc = G.scenes[k]; if (!sc || nHeroes(sc) >= sc.maxH) continue;
        if (k === 'train' && h.act !== 'train' && Math.random() < 0.5) continue;
        const s = freeSeat(sc, h); if (s && join(sc, s, h)) return;
      }
    }
    return hd0(h);
  };
  /* os moradores em cena são pulados em updateNpcs (gancho em 32-town: `if (!n._sc)`) */
  G.scenesInfo = () => { const o = {}; for (const k in G.scenes) { const sc = G.scenes[k]; o[k] = { n: occ(sc).length, h: nHeroes(sc), npc: nNpcs(sc), seats: sc.seats.length }; } return o; };

  const tk0 = G.tick;
  G.tick = (dt) => { tk0(dt); if (G.S && !G.OFFLINE) tickScenes(dt); };   // v27 (A1): no avanço do tempo ausente as cenas não rodam (heróis ficariam presos nelas)
  const reset = () => { for (const k in G.scenes) delete G.scenes[k]; acc = 0; chT = 4; };
  G.scenesStop = () => { for (const k of Object.keys(G.scenes)) dissolve(k); acc = 0; chT = 4; };   // v27 (A1): antes de avançar o tempo ausente, solta quem está numa cena
  const ng = G.newGame; G.newGame = () => { const S = ng(); reset(); return S; };
  const al = G.afterLoad; G.afterLoad = () => { al(); reset(); };
  /* @@fim3G-cenas */
})();
;
