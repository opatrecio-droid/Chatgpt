/* 61-ui-sheets: painéis Reino, Heróis, Forja, Missões e Mais. */
'use strict';
(function () {
  if (G.HEADLESS) return;
  const UI = G.UI, A = G.A, R = G.R, ic = UI.ic, esc = UI.esc, $ = UI.$;
  let v = null, dirty = false, lastKey = '';
  const body = () => $('#sheet .sh-body');

  /* ---------- pequenos blocos ---------- */
  const cost = (gold, c, nuc) => {
    let h = '';
    if (gold) h += '<span ' + v.At('class', () => 'cost' + (G.S.gold < gold ? ' lack' : '')) + '>' + ic('coin') + G.fmt(gold) + '</span>';
    for (const k in c || {}) h += '<span ' + v.At('class', () => 'cost' + ((G.S.res[k] || 0) < c[k] ? ' lack' : '')) + '><i class="px ri-' + k + '"></i>' + G.fmt(c[k]) + ' <span class="mut">' + G.RES[k].name.split(' ')[0] + '</span></span>';
    if (nuc) h += '<span ' + v.At('class', () => 'cost' + (G.S.nucleos < nuc ? ' lack' : '')) + '>' + ic('core') + nuc + '</span>';
    return '<div class="costs">' + h + '</div>';
  };
  const bar = (fn, cls) => '<div class="bar ' + (cls || '') + '"><i ' + v.W(fn) + '></i></div>';
  const rank = (r) => '<i class="rank" style="background:' + G.RANK_COLOR[r] + '">' + G.RANKS[r] + '</i>';
  const thumbs = {};
  const bldThumb = (id) => { const l = G.bLvl(id), k = id + '|' + (l <= 0 ? 0 : l < 3 ? 1 : l < 6 ? 2 : l < 10 ? 3 : 4); if (!thumbs[k]) thumbs[k] = A.building(id, Math.max(1, l), 0).cv.toDataURL(); return thumbs[k]; };
  const pct = (x) => Math.round(x * 100) + '%';
  const itemLine = (it) => { const s = G.itemStats(it); const a = []; if (s.atk) a.push('Atq +' + G.fmt(s.atk)); if (s.def) a.push('Def +' + G.fmt(s.def)); if (s.hp) a.push('Vida +' + G.fmt(s.hp)); if (s.crit) a.push('Crít +' + pct(s.crit)); return a.join(' · '); };
  const gi = (it) => '<i class="gi px gi-' + it.type + ' rar' + it.rar + '"' + (it.plus ? ' data-t="+' + it.plus + '"' : '') + ' style="box-shadow:inset 0 -3px 0 ' + G.tierColor(it.tier) + '"></i>';
  UI.gi = gi; UI.itemLine = itemLine; UI.rank = rank;

  const bldEffect = (id, l) => {
    l = Math.max(1, l);
    const save = G.S.b[id]; const had = save ? save.lvl : 0; if (!save) G.S.b[id] = { lvl: l }; else save.lvl = l;
    let t = '';
    try {
      const r = G.prodRates();
      switch (id) {
        case 'cidadela': t = 'Outras construções até o nível ' + (l + 2) + ' · armazém ' + G.fmt(G.resCap('madeira')) + ' · até ' + G.popCap() + ' moradores'; break;
        case 'guilda': t = 'Autoriza promoção até o Rank ' + G.RANKS[Math.min(7, l)]; break;
        case 'hospedaria': t = 'Abriga ' + (3 + l) + ' heróis · descanso ' + pct(0.12 * l) + ' mais rápido'; break;
        case 'taverna': t = 'Estoque de ' + G.resCap('refeicao') + ' refeições · ânimo sobe ' + pct(0.1 * l) + ' mais rápido'; break;
        case 'enfermaria': t = 'Cura ' + pct(0.2 * l) + ' mais rápida · caídos voltam ' + pct(1 - 1 / (1 + 0.3 * l)) + ' antes'; break;
        case 'ferraria': t = 'Forja até ' + G.tierName(G.forgeMaxTier()) + ' · aprimora até +' + Math.min(15, 4 + l) + (l >= 3 ? ' · encomendas automáticas' : ''); break;
        case 'alquimista': t = r.pocao.toFixed(1).replace('.', ',') + ' poções/h · estoque ' + G.resCap('pocao') + ' · poção cura ' + pct(Math.min(0.8, 0.45 + 0.03 * l)); break;
        case 'mercado': t = 'Vende por ' + pct(0.45 + 0.05 * l) + ' do valor · dízimo maior · armazém +' + 60 * l; break;
        case 'padaria': t = r.refeicao.toFixed(1).replace('.', ',') + ' refeições/h (2 trigo cada)'; break;
        case 'treino': t = l + ' herói(s) por vez · +' + pct(0.1 + 0.01 * l) + ' de experiência por sessão'; break;
        case 'santuario': t = 'Bênçãos ' + pct(0.1 * l) + ' mais fortes · Graça das Luas ' + pct(Math.min(0.6, 0.12 + 0.05 * l)); break;
        case 'torre': t = 'Na Maré, dispara a cada ' + Math.max(0.8, 2.6 - 0.15 * l).toFixed(1).replace('.', ',') + ' s · aviso com 2 dias'; break;
        case 'fazenda': t = r.trigo.toFixed(1).replace('.', ',') + ' trigo/h · ' + r.ervas.toFixed(1).replace('.', ',') + ' ervas/h'; break;
        case 'lenharia': t = r.madeira.toFixed(1).replace('.', ',') + ' madeira/h'; break;
        case 'pedreira': t = r.pedra.toFixed(1).replace('.', ',') + ' pedra/h · ' + r.minerio.toFixed(1).replace('.', ',') + ' minério/h'; break;
      }
    } finally { if (!save) delete G.S.b[id]; else save.lvl = had; }
    return t;
  };
  const REP = { servicos: 'Serviços aos heróis', forja: 'Vendas da forja', pocoes: 'Poções', treino: 'Campo de Treino', exportacao: 'Mercado e exportações', dizimo: 'Dízimo do comércio', chefes: 'Recompensas de chefes', mare: 'Maré da Fenda', fenda: 'Fenda Infinita', contratos: 'Contratos', missoes: 'Jornada', eventos: 'Eventos', reino: 'Nível do Reino',
    '-obras': 'Obras', '-forja': 'Custos da forja', '-salarios': 'Salários', '-recrutas': 'Portal', '-promocao': 'Promoções', '-cura': 'Enfermaria', '-mercado': 'Compras no mercado', '-decretos': 'Decretos', '-eventos': 'Eventos', '-saque': 'Saque da Maré' };

  /* ================= REINO ================= */
  const reino = {
    title: 'Reino', tabs: [['geral', 'Visão geral'], ['obras', 'Construções'], ['publicas', 'Obras públicas'], ['mercado', 'Mercado']],
    render(tab, sub) {
      const S = G.S;
      if (tab === 'geral') {
        const nz = G.ZONES.find((z) => z.unlock > S.realm.lvl);
        let h = '<div class="card hl"><h3 class="cz">Nível de Reino ' + S.realm.lvl + ' <small>' + G.threatName(S.realm.lvl) + '</small></h3>' + bar(() => Math.round(100 * G.S.realm.xp / G.realmNeed(G.S.realm.lvl)), 'big') + '<p>' + v.T(() => G.fmt(G.S.realm.xp) + ' / ' + G.fmt(G.realmNeed(G.S.realm.lvl))) + ' de renome' + (nz ? ' · ' + nz.name + ' abre no nível ' + nz.unlock : '') + (S.realm.lvl < 5 ? ' · Fenda Infinita no nível 5' : '') + '</p></div>';
        h += '<div class="grid2"><div class="stat"><small>Moradores</small><b>' + v.T(() => G.S.pop + ' / ' + G.popCap()) + '</b></div><div class="stat"><small>Felicidade</small><b>' + v.T(() => Math.round(G.S.happy) + '%') + '</b></div><div class="stat"><small>Dízimo por dia</small><b class="good">+' + v.T(() => G.fmt(G.taxEstimate())) + '</b></div><div class="stat"><small>Salários por dia</small><b class="bad">−' + v.T(() => G.fmt(G.wages())) + '</b></div></div>';
        const m = S.mare;
        h += '<div class="card" style="margin-top:8px"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:22px;color:var(--epic)">' + ic('wave') + '</span><div class="gr"><h3>Maré da Fenda</h3><p>' + (S.realm.lvl < 3 ? 'Ainda dorme. Desperta quando Aurora alcançar o Nível de Reino 3.' : m.active ? 'Em curso! Defenda os portões.' : v.T(() => { const d = G.S.mare.next - G.S.day; return d <= 0 ? 'Chega hoje, às 20h30' : 'Chega em ' + d + ' dia' + (d > 1 ? 's' : '') + ', ao anoitecer'; }) + ' · nível estimado ' + G.mareLevel() + ' · ' + m.wins + ' vitórias, ' + m.losses + ' derrotas') + '</p></div></div></div>';
        const rates = G.prodRates();
        h += '<div class="sec">Armazém</div><div class="grid2">';
        for (const id of G.BASE_RES) h += '<div class="res"><i class="px ri-' + id + '"></i><div class="gr"><b>' + v.T(() => G.fmt(G.S.res[id] || 0) + ' / ' + G.fmt(G.resCap(id))) + '</b><small>' + G.RES[id].name + (rates[id] ? ' · +' + rates[id].toFixed(1).replace('.', ',') + '/h' : '') + '</small></div></div>';
        h += '</div>';
        const mats = Object.keys(S.res).filter((k) => G.BASE_RES.indexOf(k) < 0 && S.res[k] >= 1);
        if (mats.length) { h += '<div class="sec">Espólio dos heróis</div><div class="grid2">'; for (const id of mats) h += '<div class="res"><i class="px ri-' + id + '"></i><div class="gr"><b>' + v.T(() => G.fmt(G.S.res[id] || 0)) + '</b><small>' + G.RES[id].name + '</small></div></div>'; h += '</div>'; }
        const rp = S.rep.last;
        h += '<div class="sec">Livro-caixa de ontem</div>';
        if (!rp) h += '<div class="empty">O primeiro relatório sai ao amanhecer.</div>';
        else {
          h += '<div class="card">'; const ks = Object.keys(rp).filter((k) => REP[k]).sort((a, b) => (a[0] === '-') - (b[0] === '-') || rp[b] - rp[a]);
          for (const k of ks) h += '<div class="kv"><span>' + REP[k] + '</span><b class="' + (k[0] === '-' ? 'bad' : 'good') + '">' + (k[0] === '-' ? '−' : '+') + G.fmt(rp[k]) + '</b></div>';
          h += '<div class="kv"><span>Saldo do dia</span><b class="gold">' + (rp._in - rp._out >= 0 ? '+' : '−') + G.fmt(Math.abs(rp._in - rp._out)) + '</b></div><div class="kv"><span>Abates · quedas · espólio</span><b>' + (rp.kills || 0) + ' · ' + (rp.falls || 0) + ' · ' + (rp.mats || 0) + '</b></div>';
          const hs = S.rep.hist; if (hs.length > 1) { const mx = Math.max(1, ...hs.map((x) => Math.max(x.i, x.o))); h += '<div class="spark">' + hs.map((x) => '<i style="height:' + Math.max(3, Math.round(100 * x.i / mx)) + '%"></i><i class="o" style="height:' + Math.max(3, Math.round(100 * x.o / mx)) + '%"></i>').join('') + '</div><p>Receita (dourado) e despesa (vermelho) dos últimos ' + hs.length + ' dias</p>'; }
          h += '</div>';
        }
        const bf = []; const b = S.ev.buff;
        if (b.festival > S.t) bf.push('Festival da Colheita'); if (b.torneio > S.t) bf.push('Torneio de Aurora (+50% exp.)'); if (b.furia > S.t) bf.push('Chamado às Armas'); if (S.ev.redMoon > S.t) bf.push('Lua Rubra'); if (S.ev.curfew > S.t) bf.push('Toque de recolher'); if (S.ev.caravan === S.day) bf.push('Caravana no mercado (venda em dobro)'); if (S.ev.inspired > 0) bf.push('Ferreiro inspirado (' + S.ev.inspired + ')'); if (S.ev.blight > S.day) bf.push('Praga na lavoura');
        if (bf.length) h += '<div class="sec">Em vigor</div><div class="chips">' + bf.map((x) => '<span class="pill gold">' + x + '</span>').join('') + '</div>';
        return h;
      }
      if (tab === 'obras') {
        let h = '', locked = '';
        const ids = G.BLD_IDS.slice().sort((a, b) => (G.bLvl(a) > 0) - (G.bLvl(b) > 0));
        for (const id of ids) {
          const d = G.BLD[id], l = G.bLvl(id), bs = S.b[id];
          if (!G.bAvailable(id)) { locked += '<div class="card lock"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:20px">' + ic('lock') + '</span><div class="gr"><h3>' + d.name + '</h3><p>Requer Cidadela nível ' + d.cid + '. ' + d.desc + '</p></div></div></div>'; continue; }
          const c = G.bCost(id, l + 1), maxed = id !== 'cidadela' && l + 1 > G.bMax(id), needRealm = id === 'cidadela' && S.realm.lvl < G.cidReq(l + 1);
          h += '<div class="card' + (sub && sub.bld === id ? ' hl' : '') + '" id="bc-' + id + '"><div class="row"><i class="thumb px" style="background-image:url(' + bldThumb(id) + ')" data-a="see:' + id + '"></i><div class="gr"><h3>' + d.name + (l ? ' <span class="lvl">Nv ' + l + '</span>' : ' <span class="pill gold">novo</span>') + '</h3><p>' + (l ? bldEffect(id, l) : d.desc) + '</p></div></div>';
          if (bs && bs.dmg) h += '<p class="bad">Danificada na Maré. Fechada até o conserto.</p><div class="row" style="margin-top:8px"><div class="gr">' + cost(G.repairCost(id)) + '</div><button class="btn red" data-a="repair:' + id + '" ' + v.Dis(() => G.S.gold < G.repairCost(id)) + '>' + ic('hammer') + 'Consertar</button></div>';
          else if (maxed) h += '<p class="gold" style="margin-top:6px">No limite. Melhore a Cidadela para o nível ' + (l - 1) + ' para continuar.</p>';
          else h += (l ? '<p style="margin-top:6px"><b class="good">Nv ' + (l + 1) + ':</b> ' + bldEffect(id, l + 1) + '</p>' : '') + (needRealm ? '<p class="bad">Requer Nível de Reino ' + G.cidReq(l + 1) + '</p>' : '') + '<div class="row" style="margin-top:2px"><div class="gr">' + cost(c.gold, c.cost) + '</div><button class="btn pri" data-a="upg:' + id + '" ' + v.Dis(() => !G.canUpgrade(id).ok) + '>' + ic(l ? 'up' : 'hammer') + (l ? 'Melhorar' : 'Construir') + '</button></div>';
          h += '</div>';
        }
        return h + (locked ? '<div class="sec">Em breve</div>' + locked : '');
      }
      if (tab === 'publicas') {
        let h = '<div class="card hl"><p>Obras públicas não têm limite de nível. São o destino certo para o ouro que sobra no cofre.</p></div>';
        for (const w of G.WORKS) { const l = G.workLvl(w.id), c = G.workCost(l); h += '<div class="card"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:22px;color:var(--gold2)">' + ic(w.icon) + '</span><div class="gr"><h3>' + w.name + ' <span class="lvl">Nv ' + l + '</span></h3><p>' + w.desc + ' Agora: <b class="gold">+' + l * w.per + w.unit + '</b></p></div></div><div class="row" style="margin-top:2px"><div class="gr">' + cost(c) + '</div><button class="btn pri" data-a="work:' + w.id + '" ' + v.Dis(() => G.S.gold < G.workCost(G.workLvl(w.id))) + '>' + ic('up') + 'Investir</button></div></div>'; }
        return h;
      }
      if (tab === 'mercado') {
        if (!G.bOk('mercado')) return '<div class="empty">' + (G.bLvl('mercado') ? 'O Mercado está fechado para conserto.' : 'Construa o Mercado (Cidadela nível 2) para vender excedente, comprar matéria-prima e receber caravanas.') + '</div>';
        let h = S.ev.caravan === S.day ? '<div class="card hl"><h3>' + ic('gift') + ' Caravana do Leste na cidade</h3><p>Tudo o que você vender hoje rende o dobro.</p></div>' : '';
        h += '<button class="tog" data-a="opt:autoSell"><span>Vender excedente automaticamente<small>O que não couber no armazém vai para o mercado por 70% do preço.</small></span><i class="sw' + (S.opts.autoSell ? ' on' : '') + '"></i></button>';
        h += '<div class="sec">Matéria-prima</div>';
        for (const id of G.BUYABLE) h += '<div class="card"><div class="row"><i class="px ri-' + id + '" style="width:28px;height:28px"></i><div class="gr"><h3>' + G.RES[id].name + ' <small>' + v.T(() => G.fmt(G.S.res[id] || 0)) + '</small></h3><p>Vende a ' + String(G.sellPrice(id)).replace('.', ',') + ' · compra a ' + String(G.buyPrice(id)).replace('.', ',') + '</p></div><button class="btn sm" data-a="sell:' + id + ':20" ' + v.Dis(() => (G.S.res[id] || 0) < 1) + '>Vender 20</button><button class="btn sm pri" data-a="buy:' + id + ':20" ' + v.Dis(() => G.S.gold < G.buyPrice(id) * 20) + '>Comprar 20</button></div></div>';
        const mats = Object.keys(S.res).filter((k) => G.BASE_RES.indexOf(k) < 0 && S.res[k] >= 1);
        h += '<div class="sec">Espólio</div>';
        if (!mats.length) h += '<div class="empty">Nenhum espólio no armazém ainda.</div>';
        for (const id of mats) h += '<div class="card"><div class="row"><i class="px ri-' + id + '" style="width:28px;height:28px"></i><div class="gr"><h3>' + G.RES[id].name + ' <small>' + v.T(() => G.fmt(G.S.res[id] || 0)) + '</small></h3><p>Vende a ' + String(G.sellPrice(id)).replace('.', ',') + ' cada</p></div><button class="btn sm" data-a="sell:' + id + ':10" ' + v.Dis(() => (G.S.res[id] || 0) < 1) + '>Vender 10</button><button class="btn sm" data-a="sell:' + id + ':half" ' + v.Dis(() => (G.S.res[id] || 0) < 2) + '>Metade</button></div></div>';
        return h;
      }
      return '';
    },
    after(tab, sub) { if (tab === 'obras' && sub && sub.bld) { const el = document.getElementById('bc-' + sub.bld); if (el) el.scrollIntoView({ block: 'center' }); sub.bld = null; } },
  };

  /* ================= HERÓIS ================= */
  const herois = {
    title: 'Heróis', tabs: [],
    render(tab, sub) {
      const S = G.S;
      const h0 = sub && sub.hero ? S.heroes.find((x) => x.id === sub.hero) : null;
      if (h0) return heroDetail(h0);
      let h = '<div class="card hl"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:22px;color:var(--epic)">' + ic('portal') + '</span><div class="gr"><h3>Portal de Aurora <small>' + S.heroes.length + ' / ' + G.heroCap() + ' heróis</small></h3><p>' + (S.heroes.length >= G.heroCap() ? 'Sem camas livres. Melhore a Hospedaria.' : 'O Portal revela três viajantes. Você escolhe um.') + '</p></div><button class="btn vio" data-a="portal">Abrir</button></div></div>';
      for (const x of S.heroes) {
        h += '<div class="card"><button class="hrow" data-a="herod:' + x.id + '"><i class="pt px" style="background-image:url(' + UI.portrait(x) + ');border-color:' + G.RANK_COLOR[x.rank] + '"></i><span class="gr"><span class="nm">' + rank(x.rank) + esc(x.name) + (x.stars ? ' <span class="gold">' + '★'.repeat(Math.min(5, x.stars)) + '</span>' : '') + '<span class="mut" style="font-weight:700;font-size:11.5px">' + G.heroTitle(x) + ' · ' + v.T(() => 'Nv ' + x.lvl) + '</span></span><span class="sb">' + v.T(() => G.stateLabel(x) + ' · ' + G.fmt(x.gold) + ' moedas' + (x.noZone ? ' · sem zona segura!' : '')) + '</span><span class="mini">' + bar(() => Math.round(100 * Math.max(0, x.hp) / G.heroStats(x).hp), 'g') + bar(() => Math.round(x.fome), 'o') + bar(() => Math.round(x.energia), 'b') + bar(() => Math.round(x.animo), 'p') + '</span></span>' + (G.canPromote(x) || G.canRebirth(x) ? '<span class="pill gold">' + ic('up') + 'promover</span>' : ic('next')) + '</button></div>';
      }
      return h + '<p class="mut" style="text-align:center;font-size:11px;margin-top:8px">Barras: vida · fome · energia · ânimo</p>';
    },
    subTitle(sub) { const h = sub && sub.hero ? G.S.heroes.find((x) => x.id === sub.hero) : null; return h ? h.name : null; },
  };
  const heroDetail = (x) => {
    const S = G.S, c = G.CLASSES[x.cls], look = A.heroLook(x);
    const st = () => G.heroStats(x);
    let h = '<div class="card hl"><div class="row"><i class="px" style="width:78px;height:90px;background-image:url(' + A.fullBody(look) + ');background-size:78px 90px"></i><div class="gr"><h3 style="font-size:16px">' + rank(x.rank) + ' ' + esc(x.name) + (x.stars ? ' <span class="gold">' + '★'.repeat(Math.min(5, x.stars)) + (x.stars > 5 ? '×' + x.stars : '') + '</span>' : '') + '</h3><p><span class="rar' + x.rar + '" style="font-weight:800">' + G.RAR[x.rar] + '</span> · ' + G.heroTitle(x) + ' · ' + v.T(() => 'Nível ' + x.lvl + ' / ' + G.RANK_CAP[x.rank]) + '</p>' + bar(() => Math.round(100 * x.xp / G.xpNeed(x.lvl)), 'big') + '<p>' + v.T(() => G.stateLabel(x)) + '</p></div></div>' +
      '<div class="row" style="margin-top:8px"><button class="btn sm" data-a="follow:' + x.id + '">' + ic('eye') + 'Seguir no mapa</button>' + '<span ' + v.At('style', () => (x.state === 'recover' || x.state === 'fallen' ? '' : 'display:none')) + '><button class="btn sm red" data-a="revive:' + x.id + '" ' + v.Dis(() => G.S.gold < G.price(x, 'revive') * 2) + '>' + ic('heart') + 'Reerguer agora · ' + G.fmt(G.price(x, 'revive') * 2) + '</button></span></div></div>';
    h += '<div class="grid3"><div class="stat"><small>Vida</small><b>' + v.T(() => G.fmt(Math.max(0, x.hp)) + '/' + G.fmt(st().hp)) + '</b></div><div class="stat"><small>Ataque</small><b>' + v.T(() => G.fmt(st().atk)) + '</b></div><div class="stat"><small>Defesa</small><b>' + v.T(() => G.fmt(st().def)) + '</b></div><div class="stat"><small>Crítico</small><b>' + v.T(() => pct(st().crit)) + '</b></div><div class="stat"><small>Esquiva</small><b>' + v.T(() => pct(st().eva)) + '</b></div><div class="stat"><small>Aguenta até</small><b>' + v.T(() => 'Nv ' + st().eff) + '</b></div><div class="stat"><small>Bolsa</small><b class="gold">' + v.T(() => G.fmt(x.gold)) + '</b></div><div class="stat"><small>Abates</small><b>' + v.T(() => G.fmt(x.kills)) + '</b></div><div class="stat"><small>Quedas</small><b>' + v.T(() => x.falls) + '</b></div></div>';
    h += '<div class="card" style="margin-top:8px"><div class="need">' + ic('heart') + bar(() => Math.round(100 * Math.max(0, x.hp) / st().hp), 'g') + 'Vida</div><div class="need" style="margin-top:6px">' + ic('meal') + bar(() => Math.round(x.fome), 'o') + 'Fome</div><div class="need" style="margin-top:6px">' + ic('bolt') + bar(() => Math.round(x.energia), 'b') + 'Energia</div><div class="need" style="margin-top:6px">' + ic('smile') + bar(() => Math.round(x.animo), 'p') + 'Ânimo</div><p style="margin-top:8px">' + ic('potion').replace('class="i"', 'class="i" style="display:inline;vertical-align:-2px"') + ' ' + v.T(() => x.potions + ' / ' + G.potCap(x)) + ' poções na bolsa · espólio ' + v.T(() => x.bagN + ' / ' + G.bagCap(x)) + '</p></div>';
    /* equipamento */
    h += '<div class="sec">Equipamento</div>';
    for (const [slot, type] of [['arma', c.w], ['armadura', c.a], ['acessorio', 'anel']]) { const it = x.gear[slot]; h += it ? '<button class="slot" data-a="item:' + it.id + ':' + x.id + '">' + gi(it) + '<span class="gr"><b class="rar' + it.rar + '">' + G.itemName(it) + '</b><br><span class="mut" style="font-size:11.5px">' + G.RAR[it.rar] + ' · ' + itemLine(it) + '</span></span>' + ic('next') + '</button>' : '<div class="slot"><i class="gi px gi-' + type + '" style="opacity:.35"></i><span class="gr"><b class="mut">' + G.SLOT[slot] + ' vazio</b><br><span class="mut" style="font-size:11.5px">Forje ' + G.GEAR[type].name.toLowerCase() + ' — ' + x.name + ' compra se tiver moedas.</span></span></div>'; }
    /* ordens */
    h += '<div class="sec">Ordens</div><div class="card"><p style="margin:0 0 6px">Onde caçar</p><div class="chips"><button data-a="order:' + x.id + ':auto" class="' + (x.order === 'auto' ? 'on' : '') + '">Automático</button>' + G.ZONES.filter(G.zoneUnlocked).map((z) => '<button data-a="order:' + x.id + ':' + z.id + '" class="' + (x.order === z.id ? 'on' : '') + '">' + z.name.split(' ')[0] + ' · Nv ' + G.zoneLvl(z, S.zones[z.id].tier) + '</button>').join('') + '</div><p style="margin:10px 0 6px">Cautela — quando recuar</p><div class="seg">' + G.CAUTION.map((cc, i) => '<button data-a="caution:' + x.id + ':' + i + '" class="' + (x.caution === i ? 'on' : '') + '">' + cc.name + '</button>').join('') + '</div><p>' + ['Recua só com 20% de vida e encara chefes mais fortes. Mais abates, mais quedas.', 'Recua com 35% de vida. Entra em chefes quando aguenta ou tem companhia.', 'Recua com 50% de vida e nunca enfrenta chefes. Seguro, porém lento.'][x.caution] + '</p></div>';
    /* promoção */
    const q = G.promoReq(x);
    h += '<div class="sec">Carreira</div>';
    if (G.canRebirth(x)) h += '<div class="card hl"><h3>Renascimento</h3><p>' + x.name + ' volta ao nível 1, Rank E, com +30% em todos os atributos para sempre e mantém o equipamento.</p><button class="btn vio wide" style="margin-top:8px" data-a="rebirth:' + x.id + '">' + ic('star') + 'Renascer sob as Duas Luas</button></div>';
    else if (q) h += '<div class="card"><h3>Promoção a Rank ' + G.RANKS[x.rank + 1] + ' <small>atributos ×' + (G.RANK_MULT[x.rank + 1] / G.RANK_MULT[x.rank]).toFixed(2).replace('.', ',') + ' · nível máximo ' + G.RANK_CAP[x.rank + 1] + '</small></h3><div class="kv"><span>Nível ' + q.lvl + '</span><b ' + v.At('class', () => (x.lvl >= q.lvl ? 'good' : 'bad')) + '>' + v.T(() => x.lvl + ' / ' + q.lvl) + '</b></div><div class="kv"><span>Guilda nível ' + q.guilda + '</span><b class="' + (G.bLvl('guilda') >= q.guilda ? 'good' : 'bad') + '">' + G.bLvl('guilda') + ' / ' + q.guilda + '</b></div><div class="row" style="margin-top:4px"><div class="gr">' + cost(q.gold, q.cost) + '</div><button class="btn pri" data-a="promote:' + x.id + '" ' + v.Dis(() => !G.canPromote(x)) + '>' + ic('up') + 'Promover</button></div></div>';
    else h += '<div class="card"><p>Rank máximo. Alcance o nível 80 para renascer.</p></div>';
    h += '<div class="sec">Classe e traços</div><div class="trait"><b>' + c.skill.name + '</b><span>' + c.skill.desc + ' Recarga de ' + c.skill.cd + ' s.</span></div>';
    for (const t of x.traits) h += '<div class="trait"><b>' + G.TRAITS[t].name + '</b><span>' + G.TRAITS[t].desc + '</span></div>';
    h += '<button class="btn wide" style="margin-top:10px;color:#ff9a9a" data-a="dismiss:' + x.id + '">' + ic('trash') + 'Dispensar ' + esc(x.name) + '</button>';
    return h;
  };

  /* ================= FORJA ================= */
  let forgeTier = 0;
  const forja = {
    title: 'Forja', tabs: [['forjar', 'Forjar'], ['arsenal', 'Vitrine']],
    render(tab) {
      const S = G.S;
      if (!G.bLvl('ferraria')) return '<div class="empty">Construa a Ferraria para transformar o espólio dos heróis em armas e armaduras.<br><br><button class="btn pri" data-a="open:reino:obras">Ver construções</button></div>';
      if (tab === 'arsenal') {
        let h = '<div class="card hl"><p>Tudo aqui está à venda. Os heróis compram sozinhos o que serve para a classe deles, se tiverem moedas na bolsa. Você também pode presentear.</p></div>';
        if (!S.inv.length) return h + '<div class="empty">Vitrine vazia. Forje algo na aba ao lado.</div>';
        const items = S.inv.slice().sort((a, b) => b.tier - a.tier || b.rar - a.rar);
        for (const it of items) h += '<div class="card"><div class="row">' + gi(it) + '<div class="gr"><h3 class="rar' + it.rar + '">' + G.itemName(it) + '</h3><p>' + G.RAR[it.rar] + ' · ' + itemLine(it) + ' · <span class="gold">' + G.fmt(G.itemPrice(it)) + ' moedas</span></p></div></div><div class="row" style="margin-top:8px"><button class="btn sm" data-a="item:' + it.id + '">' + ic('up') + 'Aprimorar</button><button class="btn sm" data-a="gift:' + it.id + '">' + ic('gift') + 'Presentear</button><span class="gr"></span><button class="btn sm" data-a="melt:' + it.id + '">' + ic('coin') + G.fmt(Math.round(G.itemPrice(it) * (G.bOk('mercado') ? 0.4 : 0.25))) + '</button></div></div>';
        return h;
      }
      const mt = G.forgeMaxTier(); if (!forgeTier || forgeTier > mt) forgeTier = mt;
      const want = UI.wanted();
      let h = '';
      if (want.length) { h += '<div class="card hl"><h3>' + ic('people') + ' Encomendas dos heróis</h3>'; for (const w of want.slice(0, 5)) h += '<div class="row" style="margin-top:8px"><i class="gi px gi-' + w.type + '" style="box-shadow:inset 0 -3px 0 ' + G.tierColor(w.tier) + '"></i><div class="gr"><b style="font-size:12.5px">' + G.GEAR[w.type].name + ' ' + G.tierName(w.tier) + '</b><br><span class="mut" style="font-size:11.5px">' + w.who.join(', ') + (w.pay ? '' : ' · ainda juntando moedas') + '</span></div><button class="btn sm pri" data-a="craft:' + w.type + ':' + w.tier + ':0" ' + v.Dis(() => !G.canCraft(w.type, w.tier, false).ok) + '>Forjar</button></div>'; h += '</div>'; }
      h += '<div class="chips" style="margin:4px 0 8px">'; for (let t = 1; t <= mt + 1; t++) h += '<button data-a="ftier:' + t + '" class="' + (t === forgeTier ? 'on' : '') + '"' + (t > mt ? ' disabled' : '') + ' style="' + (t <= mt ? 'box-shadow:inset 0 -3px 0 ' + G.tierColor(t) : '') + '">' + (t > mt ? ic('lock').replace('class="i"', 'class="i" style="display:inline;vertical-align:-2px"') + ' ' : '') + G.tierName(t).replace('de ', '').replace('da ', '').replace('das ', '') + '</button>'; h += '</div>';
      const w = G.rarWeights(false), tot = w.reduce((a, b) => a + b, 0);
      h += '<p class="mut" style="font-size:11.5px;margin:0 2px 8px">Chances: ' + w.map((x, i) => (x / tot >= 0.001 ? '<span class="rar' + i + '">' + G.RAR[i] + ' ' + (100 * x / tot).toFixed(x / tot < 0.02 ? 1 : 0).replace('.', ',') + '%</span>' : '')).filter(Boolean).join(' · ') + '. Obra-prima garante Raro ou melhor.</p>';
      for (const type of G.GEAR_IDS) {
        const g = G.GEAR[type], r = G.recipe(type, forgeTier), base = { type, tier: forgeTier, rar: 0, plus: 0 }, mc = G.craftCost(type, forgeTier, true);
        const users = g.kind === 'acessorio' ? 'Todos' : G.CLASS_IDS.filter((c) => G.CLASSES[c].w === type || G.CLASSES[c].a === type).map((c) => G.CLASSES[c].name).join(', ');
        h += '<div class="card"><div class="row"><i class="gi px gi-' + type + '" style="box-shadow:inset 0 -3px 0 ' + G.tierColor(forgeTier) + '"></i><div class="gr"><h3>' + g.name + ' ' + G.tierName(forgeTier) + '</h3><p>' + itemLine(base) + ' · ' + users + ' · vende por ' + G.fmt(G.itemPrice(base)) + '+</p></div></div>' + cost(r.gold, r.cost) + '<div class="row" style="margin-top:8px"><button class="btn sm vio" data-a="craft:' + type + ':' + forgeTier + ':1" ' + v.Dis(() => !G.canCraft(type, forgeTier, true).ok) + ' title="Custa o dobro, 1 material raro e 1 Núcleo">' + ic('star') + 'Obra-prima · ' + ic('core').replace('class="i"', 'class="i" style="display:inline;vertical-align:-2px"') + '1</button><span class="gr"></span><button class="btn pri" data-a="craft:' + type + ':' + forgeTier + ':0" ' + v.Dis(() => !G.canCraft(type, forgeTier, false).ok) + '>' + ic('hammer') + 'Forjar</button></div></div>';
        void mc;
      }
      h += G.bLvl('ferraria') >= 3 ? '<button class="tog" data-a="opt:autoForge"><span>Encomendas automáticas<small>Gilda forja sozinha o que os heróis podem pagar, se houver material e sobra no cofre.</small></span><i class="sw' + (S.opts.autoForge ? ' on' : '') + '"></i></button>' : '<p class="mut" style="font-size:11.5px;text-align:center">Ferraria nível 3 libera as encomendas automáticas.</p>';
      return h;
    },
  };

  /* ================= MISSÕES ================= */
  let party = null;
  const missoes = {
    title: 'Missões', tabs: [['jornada', 'Jornada'], ['contratos', 'Contratos'], ['zonas', 'Zonas'], ['fenda', 'Fenda']],
    badge: { jornada: () => (G.questCur().done ? 1 : 0), contratos: () => G.S.daily.list.filter((c) => !c.claimed && c.p >= c.n).length + (!G.S.daily.claimed && G.S.daily.list.length && G.S.daily.list.every((c) => c.claimed) ? 1 : 0) },
    render(tab) {
      const S = G.S;
      if (tab === 'jornada') {
        const q = G.questCur(); const rw = [];
        for (const k in q.r) rw.push(k === 'gold' ? ic('coin') + G.fmt(q.r.gold) : k === 'selos' ? ic('seal') + q.r.selos : k === 'nucleos' ? ic('core') + q.r.nucleos : '<i class="px ri-' + k + '" style="width:16px;height:16px"></i>' + q.r[k]);
        let h = '<div class="card hl"><p class="cz gold" style="font-size:11px;letter-spacing:.2em">' + (q.decree ? 'DECRETO REAL ' + (S.quest.decreeN + 1) : 'CAPÍTULO ' + q.idx + ' DE ' + G.QUESTS.length) + '</p><h3 style="font-size:15.5px;margin-top:4px">' + esc(q.t) + '</h3><p>' + esc(q.h) + '</p><div style="margin-top:8px">' + bar(() => { const c = G.questCur(); return Math.round(100 * c.cur / c.n); }, 'big') + '</div><div class="row" style="margin-top:8px"><div class="gr"><div class="costs" style="margin:0">' + rw.map((x) => '<span class="cost">' + x + '</span>').join('') + '</div></div><button class="btn pri" data-a="questclaim" ' + v.Dis(() => !G.questCur().done) + '>' + ic('chest') + 'Resgatar</button></div></div>';
        if (!q.decree) { const nx = G.QUESTS.slice(S.quest.step + 1, S.quest.step + 3); if (nx.length) h += '<div class="sec">A seguir</div>' + nx.map((d) => '<div class="card lock"><div class="row">' + ic('lock') + '<div class="gr"><b style="font-size:12.5px">' + esc(d.t) + '</b></div></div></div>').join(''); }
        h += '<div class="sec">Crônica de Aurora</div>';
        for (const l of S.log.slice(-14).reverse()) h += '<div class="logl ' + l.k + '"><small>Dia ' + l.d + ' · ' + G.clockStr(l.c) + '</small>' + esc(l.m) + '</div>';
        return h;
      }
      if (tab === 'contratos') {
        const d = S.daily; let h = '<div class="card hl"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:22px;color:var(--gold2)">' + ic('chest') + '</span><div class="gr"><h3>Baú do dia <small>sequência: ' + d.streak + ' dia' + (d.streak === 1 ? '' : 's') + '</small></h3><p>Cumpra os três contratos para abrir. Rende Selos e Núcleos; a cada 5 dias seguidos, bônus.</p></div><button class="btn pri" data-a="chest" ' + v.Dis(() => G.S.daily.claimed || !G.S.daily.list.length || !G.S.daily.list.every((c) => c.claimed)) + '>' + (d.claimed ? 'Aberto' : 'Abrir') + '</button></div></div>';
        d.list.forEach((c, i) => { h += '<div class="card"><h3>' + esc(c.t) + '</h3><div style="margin-top:7px">' + bar(() => Math.round(100 * c.p / c.n), 'big g') + '</div><div class="row" style="margin-top:8px"><div class="gr"><span class="cost">' + ic('coin') + G.fmt(c.gold) + '</span> <span class="mut" style="font-size:11.5px">' + v.T(() => G.fmt(c.p) + ' / ' + G.fmt(c.n)) + '</span></div><button class="btn sm pri" data-a="contract:' + i + '" ' + v.Dis(() => c.claimed || c.p < c.n) + '>' + (c.claimed ? ic('check') + 'Recebido' : 'Receber') + '</button></div></div>'; });
        return h + '<p class="mut" style="text-align:center;font-size:11.5px">Novos contratos todo amanhecer.</p>';
      }
      if (tab === 'zonas') {
        let h = '<div class="card hl"><p>Cada vitória sobre o chefe aumenta a <b class="gold">corrupção</b> da zona: monstros mais fortes, mais espólio. Você pode baixar o nível quando quiser — bom para treinar novatos.</p></div>';
        G.ZONES.forEach((z) => {
          const zs = S.zones[z.id], zm = G.ZMATS[z.n];
          if (!G.zoneUnlocked(z)) { h += '<div class="card lock"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:20px">' + ic('lock') + '</span><div class="gr"><h3>' + z.name + '</h3><p>Abre no Nível de Reino ' + z.unlock + '. Monstros a partir do nível ' + z.lvl + '.</p></div></div></div>'; return; }
          const here = () => G.S.heroes.filter((x) => x.zone === z.id && (x.state === 'hunt' || x.state === 'travel')).length;
          h += '<div class="card"><div class="row"><i class="thumb px" style="background-image:url(' + A.monPortrait(z.boss) + ');background-size:46px 46px;border-color:' + z.color + '"></i><div class="gr"><h3>' + z.name + ' <span class="lvl">Nv ' + G.zoneLvl(z, zs.tier) + '</span></h3><p>' + z.lore + '</p></div></div>' +
            '<div class="row" style="margin-top:8px"><div class="gr"><div class="need">' + ic('skull') + bar(() => (G.S.zones[z.id].boss ? 100 : Math.round(100 * G.S.zones[z.id].gauge / G.gaugeNeed(z))), 'p') + '</div><p>' + v.T(() => (G.S.zones[z.id].boss ? G.MON[z.boss].name + ' está à solta!' : G.MON[z.boss].name + ' desperta em ' + Math.max(0, G.gaugeNeed(z) - G.S.zones[z.id].gauge) + ' abates')) + ' · ' + v.T(() => here() + ' herói(s) aqui') + ' · derrotado ' + zs.bossKills + '×</p></div></div>' +
            '<div class="row" style="margin-top:8px"><div class="step"><button data-a="tier:' + z.id + ':-1"' + (zs.tier <= 0 ? ' disabled' : '') + '>' + ic('minus') + '</button><b>' + (zs.tier === 0 ? 'Pura' : 'Corr. ' + G.roman(zs.tier)) + '</b><button data-a="tier:' + z.id + ':1"' + (zs.tier >= zs.maxTier ? ' disabled' : '') + '>' + ic('plus') + '</button></div><span class="gr"></span><i class="px ri-' + zm.a + '" style="width:20px;height:20px" title="' + G.RES[zm.a].name + '"></i><i class="px ri-' + zm.b + '" style="width:20px;height:20px"></i><i class="px ri-' + zm.r + '" style="width:20px;height:20px"></i><button class="btn sm" data-a="goto:' + z.lair[0] + ':' + (z.lair[1] + 6) + '">' + ic('eye') + 'Ver</button></div>' +
            '<button class="tog" style="border:0;padding:8px 0 0" data-a="zlock:' + z.id + '"><span style="font-size:12px">Subir a corrupção sozinha ao vencer o chefe</span><i class="sw' + (zs.lock ? '' : ' on') + '"></i></button></div>';
        });
        return h;
      }
      if (tab === 'fenda') {
        if (!G.riftOpen()) return '<div class="empty">' + ic('lock').replace('class="i"', 'class="i" style="font-size:28px;margin:0 auto 8px"') + 'A Fenda Infinita se abre na Cratera quando Aurora alcançar o Nível de Reino 5.</div>';
        const r = S.rift;
        let h = '<div class="card hl"><h3 class="cz">Fenda Infinita · andar ' + r.floor + '</h3><p>Uma escada de guardiões sem fim. Cada andar vencido rende Essência da Fenda (para os equipamentos Ascendentes), Selos e Núcleos. Lá dentro ninguém recua.</p><div class="grid3" style="margin-top:8px"><div class="stat"><small>Recorde</small><b>' + r.best + '</b></div><div class="stat"><small>Guardião</small><b>Nv ' + (G.riftLvl(r.floor) + 2) + '</b></div><div class="stat"><small>Essência</small><b>' + G.fmt(S.res.essencia || 0) + '</b></div></div></div>';
        if (r.run) return h + '<div class="card"><h3>' + ic('portal') + ' Expedição em andamento</h3><p>' + (r.run.phase === 'walk' ? 'Os heróis marcham para a Cratera, a sudoeste.' : 'Combate contra o guardião!') + '</p><button class="btn wide" style="margin-top:8px" data-a="goto:' + G.CRATER.center[0] + ':' + G.CRATER.center[1] + '">' + ic('eye') + 'Ver a Cratera</button></div>';
        const avail = S.heroes.filter((x) => x.state !== 'fallen' && x.state !== 'recover');
        if (!party) party = avail.slice().sort((a, b) => G.heroStats(b).eff - G.heroStats(a).eff).slice(0, 5).map((x) => x.id);
        party = party.filter((id) => avail.some((x) => x.id === id));
        h += '<div class="sec">Expedição (até 5)</div>';
        for (const x of avail) { const on = party.indexOf(x.id) >= 0, e = G.heroStats(x).eff, need = G.riftLvl(r.floor) + 2; h += '<button class="slot" data-a="party:' + x.id + '" style="' + (on ? 'box-shadow:inset 0 0 0 2px var(--gold)' : '') + '"><i class="px" style="width:36px;height:36px;background-image:url(' + UI.portrait(x) + ');background-size:36px 36px"></i><span class="gr"><b>' + rank(x.rank) + ' ' + esc(x.name) + '</b><br><span class="' + (e >= need ? 'good' : e >= need - 3 ? 'gold' : 'bad') + '" style="font-size:11.5px">aguenta até Nv ' + e + ' · ' + x.potions + ' poções</span></span><i class="sw' + (on ? ' on' : '') + '"></i></button>'; }
        const again = r.dayDone === S.day;
        h += '<button class="btn pri wide" style="margin-top:6px" data-a="rift" ' + v.Dis(() => !G.riftCanStart() || !party || !party.length) + '>' + ic('portal') + (again ? 'Tentar de novo hoje · 3 Núcleos' : 'Enviar expedição') + '</button><p class="mut" style="text-align:center;font-size:11.5px;margin-top:6px">Uma tentativa grátis por dia.</p>';
        return h;
      }
      return '';
    },
  };

  /* ================= MAIS ================= */
  const mais = {
    title: 'Mais', tabs: [['bencaos', 'Bênçãos'], ['bestiario', 'Bestiário'], ['cronicas', 'Conquistas'], ['opcoes', 'Opções']],
    badge: { cronicas: () => G.achPending() },
    render(tab) {
      const S = G.S;
      if (tab === 'bencaos') {
        let h = '<div class="card hl"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:22px;color:#ff9ac8">' + ic('seal') + '</span><div class="gr"><h3>' + v.T(() => G.S.selos) + ' Selos de Renome</h3><p>Ganhos ao subir o Nível de Reino, vencer chefes, Marés, a Fenda e conquistas. Bênçãos são permanentes e não têm limite.' + (G.bLvl('santuario') ? ' O Santuário as fortalece em ' + pct(0.1 * G.bLvl('santuario')) + '.' : '') + '</p></div></div></div>';
        for (const b of G.BLESS) { const l = S.bless[b.id] || 0, c = G.blessCost(l); h += '<div class="card"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:20px;color:var(--gold2)">' + ic(b.icon) + '</span><div class="gr"><h3>' + b.name + ' <span class="lvl">Nv ' + l + '</span></h3><p>' + b.desc + ' Agora: <b class="gold">+' + Math.round((G.bless(b.id) - 1) * 100) + '%</b></p></div><button class="btn pri sm" data-a="bless:' + b.id + '" ' + v.Dis(() => G.S.selos < G.blessCost(G.S.bless[b.id] || 0)) + '>' + ic('seal') + c + '</button></div></div>'; }
        return h;
      }
      if (tab === 'bestiario') {
        let h = '<div class="card hl"><p>Cada família de monstros estudada dá <b class="gold">+3% de dano e de espólio</b> contra ela, por marco de abates.</p></div>';
        const fams = {}; for (const k of G.MON_IDS) { const d = G.MON[k]; (fams[d.fam] = fams[d.fam] || []).push(k); }
        for (const f in fams) { const n = S.bestiary[f] || 0, t = G.bestTier(f), nx = G.BEST_TIERS[t], pv = t ? G.BEST_TIERS[t - 1] : 0; h += '<div class="card' + (n ? '' : ' lock') + '"><div class="row"><i class="thumb sm px" style="background-image:url(' + A.monPortrait(fams[f][0]) + ');' + (n ? '' : 'filter:brightness(0)') + '"></i><div class="gr"><h3>' + (n ? G.FAM_NAME[f] : '???') + ' <span class="lvl">+' + t * 3 + '%</span></h3><p>' + (n ? fams[f].map((k) => G.MON[k].name).slice(0, 4).join(', ') : 'Ainda não encontrado') + '</p><div style="margin-top:5px">' + bar(() => { const c = G.S.bestiary[f] || 0; return nx ? Math.round(100 * (c - pv) / (nx - pv)) : 100; }) + '</div><p>' + v.T(() => G.fmt(G.S.bestiary[f] || 0)) + (nx ? ' / ' + G.fmt(nx) : '') + ' abates</p></div></div></div>'; }
        return h;
      }
      if (tab === 'cronicas') {
        let h = '';
        for (const a of G.ACH) { const have = S.ach[a.id] || 0, t = G.achTier(a), val = S.stats[a.stat] || 0, nx = a.tiers[Math.min(a.tiers.length - 1, t)]; h += '<div class="card' + (t > have ? ' hl' : '') + '"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:20px;color:var(--gold2)">' + ic('trophy') + '</span><div class="gr"><h3>' + a.name + ' <span class="lvl">' + have + '/' + a.tiers.length + '</span></h3><p>' + G.fmt(val) + (t < a.tiers.length ? ' / ' + G.fmt(nx) : '') + ' ' + a.what + '</p><div style="margin-top:5px">' + bar(() => Math.min(100, Math.round(100 * (G.S.stats[a.stat] || 0) / nx))) + '</div></div>' + (t > have ? '<button class="btn pri sm" data-a="ach:' + a.id + '">' + ic('seal') + 'Receber</button>' : '') + '</div></div>'; }
        const st = S.stats; h += '<div class="sec">Números do reino</div><div class="card">' + [['Dias de reinado', S.day], ['Tempo de jogo', Math.floor(st.played / 3600) + 'h ' + Math.floor((st.played % 3600) / 60) + 'min'], ['Monstros abatidos', G.fmt(st.kills)], ['Chefes derrotados', st.bosses], ['Quedas de heróis', st.falls], ['Poções bebidas', G.fmt(st.potions)], ['Refeições servidas', G.fmt(st.meals)], ['Ouro arrecadado', G.fmt(st.goldIn)], ['Ouro investido', G.fmt(st.goldOut)], ['Marés vencidas / perdidas', S.mare.wins + ' / ' + S.mare.losses], ['Recorde na Fenda', 'andar ' + S.rift.best]].map(([a, b]) => '<div class="kv"><span>' + a + '</span><b>' + b + '</b></div>').join('') + '</div>';
        return h;
      }
      if (tab === 'opcoes') {
        const o = S.opts;
        return '<div class="tog"><span>' + ic('vol').replace('class="i"', 'class="i" style="display:inline;vertical-align:-2px"') + ' Efeitos sonoros</span><input type="range" min="0" max="100" value="' + Math.round(o.sfx * 100) + '" data-opt="sfx"></div><div class="tog"><span>Música ambiente</span><input type="range" min="0" max="100" value="' + Math.round(o.music * 100) + '" data-opt="music"></div>' +
          '<button class="tog" data-a="opt:lowFx"><span>Modo leve<small>Menos partículas e sem sombras de nuvens. Ajuda em aparelhos antigos.</small></span><i class="sw' + (o.lowFx ? ' on' : '') + '"></i></button>' +
          '<div class="sec">Jornada salva</div><p class="mut" style="font-size:12px;margin-bottom:8px">O jogo salva sozinho neste aparelho a cada 20 segundos. Exporte o código para guardar ou levar para outro aparelho.</p><div class="grid2"><button class="btn" data-a="export">' + ic('save') + 'Exportar</button><button class="btn" data-a="import">' + ic('save') + 'Importar</button></div><button class="btn wide" style="margin-top:8px" data-a="tutorial">' + ic('info') + 'Rever a apresentação</button><button class="btn wide" style="margin-top:8px;color:#ff9a9a" data-a="reset">' + ic('trash') + 'Apagar e recomeçar</button>' +
          '<p class="mut" style="text-align:center;font-size:11px;margin-top:14px">Aurora — Crônicas da Fenda · v' + G.VERSION + ' "Reforjada"<br>Arraste para mover · pinça ou roda do mouse para zoom · toque em tudo</p>';
      }
      return '';
    },
  };
  const SHEETS = { reino, herois, forja, missoes, mais };

  /* ---------- abrir / fechar / redesenhar ---------- */
  UI.open = (name, tab, sub) => {
    const sh = SHEETS[name]; if (!sh) return;
    if (UI.sheet && UI.sheet.name === name && !tab && !sub && !UI.sheet.sub) return UI.close();
    const prev = UI.sheet && UI.sheet.name === name ? UI.sheet : null;
    UI.sheet = { name, tab: tab || (prev && prev.tab) || (sh.tabs[0] ? sh.tabs[0][0] : ''), sub: sub || null };
    if (sh.tabs.length && !sh.tabs.some((t) => t[0] === UI.sheet.tab)) UI.sheet.tab = sh.tabs[0][0];
    $('#sheet').classList.add('on'); $('#shade').classList.add('on');
    document.querySelectorAll('#nav button').forEach((b) => b.classList.toggle('on', b.id === 'nav-' + name));
    lastKey = ''; draw(true);
  };
  UI.close = () => { if (!UI.sheet) return; UI.sheet = null; $('#sheet').classList.remove('on'); $('#shade').classList.remove('on'); document.querySelectorAll('#nav button').forEach((b) => b.classList.remove('on')); };
  UI.back = () => { if (UI.sheet && UI.sheet.sub) { UI.sheet.sub = null; draw(true); } };
  UI.sheetDirty = () => { dirty = true; };
  UI.sheetRefresh = () => { if (dirty) { dirty = false; draw(false); } else if (v) { v.refresh(); if (tabsV) tabsV.refresh(); } };
  let tabsV = null;
  const draw = (resetScroll) => {
    const s = UI.sheet; if (!s) return; const sh = SHEETS[s.name], b = body();
    const key = s.name + '|' + s.tab + '|' + (s.sub ? JSON.stringify(s.sub) : '');
    const keep = !resetScroll && key === lastKey ? b.scrollTop : 0; lastKey = key;
    const st = sh.subTitle ? sh.subTitle(s.sub) : null;
    $('#sheet h2').textContent = st || sh.title; $('#sheet .sh-head').classList.toggle('sub', !!st);
    const tb = $('#sheet .tabs'); tabsV = new UI.View(tb);
    tb.style.display = sh.tabs.length && !st ? '' : 'none';
    tb.innerHTML = sh.tabs.map(([id, l]) => '<button data-a="tab:' + id + '" class="' + (id === s.tab ? 'on' : '') + '">' + l + (sh.badge && sh.badge[id] ? tabsV.Badge(sh.badge[id]) : '') + '</button>').join('');
    v = new UI.View(b);
    b.innerHTML = sh.render(s.tab, s.sub);
    b.scrollTop = keep;
    if (sh.after) sh.after(s.tab, s.sub);
    dirty = false;
  };
  UI.redraw = () => draw(false);

  /* ---------- ações dos painéis ---------- */
  const hero = (id) => G.S.heroes.find((x) => x.id === +id);
  Object.assign(UI.ACT, {
    tab: (a) => { UI.sheet.tab = a[0]; draw(true); },
    see: (a) => { const p = G.W.plots[a[0]]; R.follow = 0; R.focus(p.cx, p.cy); if (window.innerWidth < 860) UI.close(); },
    goto: (a) => { R.follow = 0; R.focus(+a[0], +a[1]); if (window.innerWidth < 860) UI.close(); },
    upg: (a) => { if (!G.upgrade(a[0])) UI.toast(G.canUpgrade(a[0]).why || 'Não é possível agora.', 'bad'); },
    repair: (a) => { G.repair(a[0]); },
    work: (a) => { if (!G.buyWork(a[0])) UI.toast('Faltam moedas.', 'bad'); },
    sell: (a) => { const n = a[1] === 'half' ? Math.floor((G.S.res[a[0]] || 0) / 2) : +a[1]; G.sellRes(a[0], n); },
    buy: (a) => { if (!G.buyRes(a[0], +a[1])) UI.toast('Faltam moedas.', 'bad'); },
    opt: (a) => { G.S.opts[a[0]] = G.S.opts[a[0]] ? 0 : 1; draw(false); },
    follow: (a) => { const h = hero(a[0]); if (!h) return; R.follow = h.id; R.focus(h.x, h.y); UI.inspect({ type: 'hero', ref: h }); if (window.innerWidth < 860) UI.close(); },
    revive: (a) => { const h = hero(a[0]); if (h && !G.reviveNow(h)) UI.toast('Faltam moedas.', 'bad'); else draw(false); },
    order: (a) => { const h = hero(a[0]); if (h) { h.order = a[1]; draw(false); } },
    caution: (a) => { const h = hero(a[0]); if (h) { h.caution = +a[1]; draw(false); } },
    promote: (a) => { const h = hero(a[0]); if (h && G.promote(h)) { UI.banner('Promoção de rank', h.name + ' · Rank ' + G.RANKS[h.rank], G.heroTitle(h)); draw(false); } },
    rebirth: (a) => { const h = hero(a[0]); if (h) UI.confirm('Renascer ' + h.name + '?', 'Volta ao nível 1 e ao Rank E, com +30% permanentes em todos os atributos. O equipamento fica.', 'Renascer', () => { if (G.rebirth(h)) UI.banner('Sob as Duas Luas', h.name + ' renasceu', 'Estrela ' + h.stars); draw(false); }); },
    dismiss: (a) => { const h = hero(a[0]); if (h) UI.confirm('Dispensar ' + h.name + '?', 'O herói deixa Aurora para sempre. O equipamento dele volta para a vitrine.', 'Dispensar', () => { G.dismiss(h); UI.sheet.sub = null; draw(true); }); },
    ftier: (a) => { forgeTier = +a[0]; draw(false); },
    craft: (a) => { const it = G.craft(a[0], +a[1], a[2] === '1'); if (!it) return UI.toast(G.canCraft(a[0], +a[1], a[2] === '1').why || 'Não é possível agora.', 'bad'); UI.toast('Forjado: ' + G.itemName(it) + ' (' + G.RAR[it.rar] + ')', it.rar >= 2 ? 'epic' : 'good', 'hammer'); },
    melt: (a) => { const it = G.S.inv.find((i) => i.id === +a[0]); if (it) G.sellItem(it); },
    item: (a) => UI.itemModal(+a[0], a[1] ? +a[1] : 0),
    gift: (a) => UI.giftModal(+a[0]),
    contract: (a) => { if (G.contractClaim(+a[0])) UI.toast('Contrato pago!', 'good', 'coin'); },
    chest: () => { const r = G.dailyChest(); if (r) UI.banner('Baú dos contratos', '+' + r.selos + ' Selo' + (r.selos > 1 ? 's' : '') + ' · +' + r.nucleos + ' Núcleo' + (r.nucleos > 1 ? 's' : ''), 'Sequência de ' + G.S.daily.streak + ' dia(s)'); },
    tier: (a) => { const zs = G.S.zones[a[0]]; zs.tier = G.clamp(zs.tier + +a[1], 0, zs.maxTier); for (const m of G.mons) if (m.zi === G.ZONES.indexOf(G.ZONE[a[0]]) && !m.boss && !m.tgt) m.gone = true; draw(false); },
    zlock: (a) => { const zs = G.S.zones[a[0]]; zs.lock = zs.lock ? 0 : 1; draw(false); },
    party: (a) => { const id = +a[0], i = party.indexOf(id); if (i >= 0) party.splice(i, 1); else if (party.length < 5) party.push(id); else UI.toast('A expedição leva no máximo 5 heróis.', 'bad'); draw(false); },
    rift: () => { if (G.riftStart(party)) { party = null; UI.toast('Expedição a caminho da Cratera!', 'boss', 'portal'); draw(true); } },
    bless: (a) => { if (!G.buyBless(a[0])) UI.toast('Faltam Selos de Renome.', 'bad'); },
    ach: (a) => { const n = G.achClaim(a[0]); if (n) UI.toast('+' + n + ' Selo(s) de Renome', 'good', 'seal'); },
    export: () => UI.exportModal(), import: () => UI.importModal(), tutorial: () => { UI.close(); UI.tutorial(true); },
    reset: () => UI.confirm('Apagar tudo?', 'A jornada salva neste aparelho será apagada. Não há como desfazer.', 'Apagar', () => { G.M.wipe(); location.reload(); }),
  });
  document.addEventListener('input', (e) => { const k = e.target.getAttribute && e.target.getAttribute('data-opt'); if (k && G.S) { G.S.opts[k] = +e.target.value / 100; G.emit('opts'); } });
})();
