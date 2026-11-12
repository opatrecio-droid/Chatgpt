/* 3I-progressivo: v26 (lote 4-C.1) — clareza progressiva. Catálogo dos sistemas do reino, quando cada um abre,
   o selo "Novo!" (até o primeiro toque) e a dica de uma linha (uma vez por sistema). Simulação, sem DOM: a interface mora em 6E.
   Estado novo: S.sys = { v, open: { id: dia }, hint: { id: 1 }, nw: { id: 1 } } (inicialização preguiçosa; saves antigos abrem sem migração
   visível: o que já estava liberado entra em silêncio e só ganha o selo o que o jogador nunca usou, no máximo 3). Nada aqui muda a jogabilidade. */
'use strict';
(function () {
  const rl = () => G.S.realm.lvl, cid = () => G.bLvl('cidadela'), step = () => G.S.quest.step;
  const has = (o) => !!o && Object.keys(o).length > 0;
  /* Cada sistema: id, n (nome), ic (ícone), open(S) (condição; depois de aberto fica aberto), req (o que falta, para cadeados e Livro),
     hint (dica de uma linha, continua depois do nome), near(S) (perto de abrir: vale um cadeado discreto), used(S) (o jogador já usou: saves antigos não ganham selo),
     onde ele mora: nav (botão da barra) | tab [painel, aba] | chip (seletor) | htab (aba da ficha do herói); new:false = sem selo; silent = sem dica.
     ord = ordem das dicas em saves migrados (menor primeiro). */
  G.SYSTEMS = [
    { id: 'forja', n: 'Forja', ic: 'anvil', nav: 'forja', open: () => G.bLvl('ferraria') > 0, req: 'Construa a Ferraria', hint: 'o espólio vira equipamento para os heróis.', used: (S) => S.stats.crafted > 0 },
    { id: 'armazem', n: 'Armazém', ic: 'chest', nav: 'armazem', open: () => G.bLvl('ferraria') > 0 || rl() >= 2, req: 'Construa a Ferraria', hint: 'peças, poções e materiais ficam guardados aqui.', new: false },
    { id: 'contratos', n: 'Contratos', ic: 'scroll', tab: ['missoes', 'contratos'], open: (S) => step() >= 3 || !!(G.pedidoOpen && G.pedidoOpen()) || S.daily.list.some((c) => !c.claimed && c.p >= c.n), req: 'Conclua 3 missões da Jornada', hint: 'três pedidos novos a cada amanhecer.', used: (S) => S.stats.contracts > 0 },
    { id: 'bestiario', n: 'Bestiário', ic: 'book', tab: ['mais', 'bestiario'], open: (S) => S.stats.kills >= 50, req: 'Abata 50 monstros', hint: 'estudar uma família de monstros dá bônus contra ela.' },
    { id: 'pedidos', n: 'Pedidos da cidade', ic: 'scroll', open: () => !!(G.pedidoOpen && G.pedidoOpen()), req: 'Conclua 2 missões da Jornada', hint: 'moradores pedem coisas; toque no balão dourado.', used: (S) => (S.stats.pedidos || 0) > 0 },
    { id: 'forjanuc', n: 'Núcleos', ic: 'core', chip: '.chip.nuc', open: (S) => G.bLvl('ferraria') > 0 || S.nucleos > 2 || S.stats.crafted > 0, req: 'Construa a Ferraria', silent: 1, new: false },
    { id: 'pocao', n: 'Poções', ic: 'potion', chip: '.chip.pot', open: (S) => G.bLvl('alquimista') > 0 || (S.res.pocao || 0) > 5, req: 'Construa a Casa do Alquimista', silent: 1, new: false },
    { id: 'caminhos', n: 'Caminhos', ic: 'map', tab: ['missoes', 'caminhos'], open: () => step() >= 5 || G.pathsPending() > 0, req: 'Conclua 5 missões da Jornada', hint: 'objetivos livres que apresentam o reino.', used: (S) => has(S.paths) },
    { id: 'decretos', n: 'Decretos', ic: 'bolt', chip: '#fabs', open: () => step() >= 6, req: 'Conclua 6 missões da Jornada', hint: 'poderes do trono, no raio à direita.' },
    { id: 'bencaos', n: 'Bênçãos', ic: 'seal', tab: ['mais', 'bencaos'], chip: '.chip.selo', open: (S) => S.selos > 0 || rl() >= 2 || has(S.bless), req: 'Nível de Reino 2', hint: 'Selos de Renome compram bônus permanentes.', used: (S) => has(S.bless) },
    { id: 'recordes', n: 'Poder do Reino', ic: 'crown', tab: ['mais', 'recordes'], chip: '#pwr', open: () => rl() >= 2, req: 'Nível de Reino 2', hint: 'a coroa no alto da tela; toque para ver marcos.', used: (S) => !!(S.lendas && S.lendas.seen) },
    { id: 'semana', n: 'Semana temática', ic: 'spark', chip: '#hudx', open: () => rl() >= 2, req: 'Nível de Reino 2', hint: 'toda semana tem um tema com bônus e prazo.', silent: 1, new: false },
    { id: 'cal', n: 'Calendário', ic: 'gift', chip: '#fab-cal', open: (S) => S.stats.played >= 150, req: 'Alguns minutos de jogo', silent: 1, new: false },
    { id: 'feitos', n: 'Feitos', ic: 'trophy', htab: 'feitos', open: () => rl() >= 2, req: 'Nível de Reino 2', silent: 1, new: false },
    { id: 'artes', n: 'Artes Secretas', ic: 'book', htab: 'artes', open: (S) => S.heroes.some((h) => (h.ap || 0) > 0), req: 'Um herói no nível 2', silent: 1, new: false },
    { id: 'zonas', n: 'Zonas', s: 'Zonas', rq: 'Reino 3', ic: 'skull', tab: ['missoes', 'zonas'], open: () => rl() >= 3, req: 'Nível de Reino 3', near: () => rl() >= 2, hint: 'o chefe de cada região e a corrupção.' },
    { id: 'cronicas', n: 'Conquistas', ic: 'trophy', tab: ['mais', 'cronicas'], open: () => rl() >= 3 || G.achPending() > 0, req: 'Nível de Reino 3', hint: 'metas longas que pagam Selos.' },
    { id: 'atelie', n: 'Ateliê', ic: 'shirt', tab: ['armazem', 'atelie'], open: () => rl() >= 3, req: 'Nível de Reino 3', hint: 'trajes, asas e mascotes dão visual e bônus.', used: (S) => has(S.cos) || (S.pets && S.pets.length > 0) },
    { id: 'publicas', n: 'Obras públicas', ic: 'hammer', tab: ['reino', 'publicas'], open: () => rl() >= 3, req: 'Nível de Reino 3', hint: 'o ouro que sobra rende mais aqui.', used: (S) => has(S.works) },
    { id: 'especiais', n: 'Especiais', ic: 'gift', tab: ['armazem', 'especiais'], open: () => rl() >= 2, req: 'Nível de Reino 2', silent: 1, new: false },
    { id: 'mare', n: 'Maré da Fenda', ic: 'wave', open: () => rl() >= 3, req: 'Nível de Reino 3', silent: 1 },
    { id: 'decor', n: 'Decoração', s: 'Decoração', rq: 'Cidadela 2', ic: 'flower', tab: ['reino', 'decor'], open: () => cid() >= 2, req: 'Cidadela nível 2', near: () => cid() >= 1 && rl() >= 2, hint: 'enfeites dão Encanto e pequenos bônus.', used: (S) => (S.stats.decor || 0) > 0 },
    { id: 'mercado', n: 'Mercado', ic: 'coin', tab: ['reino', 'mercado'], open: () => G.bAvailable('mercado'), req: 'Cidadela nível 2', hint: 'venda o excedente e receba caravanas.', used: () => G.bLvl('mercado') > 0 },
    { id: 'dif', n: 'Dificuldade', ic: 'skull', chip: '#hud .dif', open: () => rl() >= 4, req: 'Nível de Reino 4', hint: 'monstros mais duros rendem mais. Toque na caveira.', silent: 0 },
    { id: 'estabulo', n: 'Estábulo', s: 'Estábulo', rq: 'Cidadela 3', ic: 'shoe', tab: ['reino', 'estabulo'], htab: 'mont', open: () => G.bAvailable('estabulo'), req: 'Cidadela nível 3', near: () => cid() >= 2, hint: 'montarias deixam os heróis mais rápidos.', used: (S) => S.stable.list.length > 0 || G.bLvl('estabulo') > 0 },
    { id: 'arena', n: 'Arena das Duas Luas', s: 'Arena', rq: 'Cidadela 3', ic: 'trophy', tab: ['missoes', 'arena'], open: () => !!(G.arenaOpen && G.arenaOpen()), req: 'Cidadela nível 3 ou Reino 6', near: () => cid() >= 2 || rl() >= 4, hint: 'duele contra reinos rivais e suba de liga.', used: (S) => !!(S.arena && S.arena.duels > 0) },
    { id: 'fenda', n: 'Fenda Infinita', s: 'Fenda', rq: 'Reino 5', ic: 'portal', tab: ['missoes', 'fenda'], open: () => rl() >= 5, req: 'Nível de Reino 5', near: () => rl() >= 3, hint: 'uma escada de guardiões na Cratera.', used: (S) => S.rift.best > 0 || S.rift.floor > 1 },
    { id: 'incursoes', n: 'Incursões', s: 'Incursões', rq: 'Reino 6', ic: 'paw', tab: ['missoes', 'incursoes'], open: () => rl() >= 6, req: 'Nível de Reino 6', near: () => rl() >= 4, hint: 'elites, um Alfa e um ovo de mascote.', used: (S) => !!(S.inc && (S.inc.wins > 0 || has(S.inc.best))) },
    { id: 'colosso', n: 'Colosso da Semana', s: 'Colosso', rq: 'Reino 6', ic: 'skull', tab: ['missoes', 'colosso'], open: () => !!(G.colossoOpen && G.colossoOpen()), req: 'Nível de Reino 6 e 3 heróis', near: () => rl() >= 4, hint: 'desperta de sexta a domingo, na Cratera.', used: (S) => !!(S.colosso && S.colosso.tot && S.colosso.tot.w > 0) },
    { id: 'codex', n: 'Códex', ic: 'book', tab: ['mais', 'codex'], open: () => G.codexStats().cells > 0, req: 'Forje a primeira peça', hint: 'cada peça e inscrição vista fica registrada.' },
    { id: 'inscricoes', n: 'Inscrições e Reforja', ic: 'spark', open: () => G.codexStats().slots > 0, req: 'Uma peça com inscrição', silent: 1 },
    { id: 'promocao', n: 'Promoção e Rank', ic: 'up', open: (S) => S.stats.maxLvl >= 5, req: 'Um herói no nível 5', silent: 1 },
    { id: 'renascer', n: 'Renascimento', ic: 'star', open: (S) => S.heroes.some((h) => h.rank >= 4 || (h.stars || 0) > 0), req: 'Um herói no Rank A', silent: 1 },
    { id: 'livro', n: 'Livro do Reino', ic: 'book', tab: ['mais', 'livro'], open: () => true, req: '', new: false, silent: 1 },
  ];
  G.SYS = {}; for (const d of G.SYSTEMS) G.SYS[d.id] = d;
  /* "painel:aba" -> sistema (para filtrar abas, a próxima recompensa e os atalhos) */
  G.SYS_TAB = {}; for (const d of G.SYSTEMS) if (d.tab) G.SYS_TAB[d.tab[0] + ':' + d.tab[1]] = d.id;
  G.SYS_CAP = 3;                         // saves migrados: no máximo tantos selos "Novo!"

  const sy = (G.sysState = () => { const S = G.S; return S.sys || (S.sys = { v: 1, open: {}, hint: {}, nw: {} }); });
  /* aberto? Vale o registro (sticky); a condição crua cobre o instante antes do próximo compasso */
  G.sysOpen = (id) => {
    const S = G.S; if (!S) return true;
    const d = G.SYS[id]; if (!d) return true;
    const s = S.sys; if (s && s.open[id]) return true;
    try { return !!d.open(S); } catch (e) { return true; }
  };
  G.sysNew = (id) => !!(G.S && G.S.sys && G.S.sys.nw[id]);
  G.sysReq = (id) => (G.SYS[id] ? G.SYS[id].req : '');
  G.sysNear = (id) => { const d = G.SYS[id]; if (!d || !d.near || G.sysOpen(id)) return false; try { return !!d.near(G.S); } catch (e) { return false; } };
  G.sysTabOpen = (sheet, tab) => { const id = G.SYS_TAB[sheet + ':' + tab]; return !id || G.sysOpen(id); };
  /* mode: undefined = normal (avisa), 'quiet' = só registra (carregar save), 'migrate' = save sem S.sys (selo só no que nunca foi usado) */
  G.sysCheck = (mode) => {
    const S = G.S; if (!S) return 0;
    const s = sy(); let n = 0, seals = 0; const born = [];
    for (const d of G.SYSTEMS) {
      if (s.open[d.id]) continue;
      let ok = false; try { ok = !!d.open(S); } catch (e) { ok = false; }
      if (!ok) continue;
      s.open[d.id] = S.day || 1; n++;
      const placed = d.nav || d.tab || d.chip || d.htab;
      if (mode === 'migrate') {
        s.hint[d.id] = 1;
        let used = true; if (d.used) { try { used = !!d.used(S); } catch (e) { used = true; } }
        if (placed && d.new !== false && d.used && !used) born.push(d);
      } else if (mode === 'quiet') {
        s.hint[d.id] = 1; if (placed && d.new !== false && !d.silentSeal) s.nw[d.id] = 1;
      } else {
        if (placed && d.new !== false) s.nw[d.id] = 1;
        if (!s.hint[d.id]) { s.hint[d.id] = 1; if (!d.silent) G.emit('sysopen', { id: d.id }); }
      }
    }
    if (born.length) { for (const d of born.slice(0, G.SYS_CAP)) { s.nw[d.id] = 1; seals++; } }
    if (n) G.emit('syschg', { n, seals });
    return n;
  };
  /* o jogador tocou no sistema: some o selo */
  G.sysTouch = (id) => {
    const S = G.S, s = S && S.sys; if (!s || !s.nw[id]) return false;
    delete s.nw[id]; G.emit('sysseen', { id }); return true;
  };
  G.sysNewList = () => { const s = G.S && G.S.sys; return s ? Object.keys(s.nw) : []; };

  /* ---- jogo novo, carregar e compasso ---- */
  const ng0 = G.newGame;
  G.newGame = () => { const S = ng0(); S.sys = null; sy(); G.sysCheck('quiet'); const s = S.sys; for (const k in s.nw) delete s.nw[k]; return S; };
  const al0 = G.afterLoad;
  G.afterLoad = () => { const first = !G.S.sys; al0(); G.sysCheck(first ? 'migrate' : 'quiet'); };
  let acc = 0, dirty = true;
  for (const ev of ['bld', 'realm', 'quest', 'inv', 'heroes', 'arena', 'colosso', 'cos', 'pets', 'codex', 'stable', 'decor', 'works', 'bless']) G.on(ev, () => { dirty = true; });
  const tk0 = G.tick;
  G.tick = (dt) => { tk0(dt); if (!G.S) return; acc += dt; if (acc >= 1 || (dirty && acc >= 0.25)) { acc = 0; dirty = false; G.sysCheck(); } };

  /* ---- a próxima recompensa só aponta para o que já abriu ---- */
  const nr0 = G.nextReward;
  G.nextReward = () => {
    const r = nr0();
    const go = (o) => { const m = /^open:([a-z]+):([a-z]+)/.exec(o.go || ''); if (m) return G.sysTabOpen(m[1], m[2]); if (o.go === 'cal') return G.sysOpen('cal'); return true; };
    if (r.all.every(go)) return r;
    r.all = r.all.filter(go);
    const ready = r.all.filter((o) => o.ready).sort((a, b) => a.pr - b.pr);
    r.best = ready.length ? ready[0] : r.all.slice().sort((a, b) => b.rk - a.rk || a.pr - b.pr)[0] || null;
    return r;
  };
})();
;
