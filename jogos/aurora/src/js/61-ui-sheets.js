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
        case 'hospedaria': t = 'Abriga ' + G.heroCap() + ' heróis · descanso ' + pct(G.bfx.rest(l) - 1) + ' mais rápido'; break;
        case 'taverna': t = 'Estoque de ' + G.resCap('refeicao') + ' refeições · ânimo sobe ' + pct(G.bfx.mood(l) - 1) + ' mais rápido'; break;
        case 'enfermaria': t = 'Cura ' + pct(G.bfx.heal(l) - 1) + ' mais rápida · caídos voltam ' + pct(1 - 1 / G.bfx.revive(l)) + ' antes'; break;
        case 'ferraria': t = 'Forja até ' + G.tierName(G.forgeMaxTier()) + ' · aprimora até +' + Math.min(15, 4 + l) + (G.autoForgeN() > 0 ? ' · encomendas automáticas' : ''); break;
        case 'alquimista': t = r.pocao.toFixed(1).replace('.', ',') + ' poções/h · estoque ' + G.resCap('pocao') + ' · poção cura ' + pct(G.bfx.potHeal(l)); break;
        case 'mercado': t = 'Vende por ' + pct(G.bfx.sell(l)) + ' do valor · dízimo maior · armazém +' + 60 * l; break;
        case 'padaria': t = r.refeicao.toFixed(1).replace('.', ',') + ' refeições/h (2 trigo cada)'; break;
        case 'treino': t = l + ' herói(s) por vez · +' + pct(G.bfx.trainXp(l)) + ' de experiência por sessão'; break;
        case 'santuario': t = 'Bênçãos ' + pct(G.bfx.bless(l) - 1) + ' mais fortes · Graça das Luas ' + pct(G.bfx.grace(l)); break;
        case 'torre': t = 'Na Maré, dispara a cada ' + G.bfx.towerGap(l).toFixed(1).replace('.', ',') + ' s · aviso com ' + G.mareLead() + ' dias'; break;
        case 'fazenda': t = r.trigo.toFixed(1).replace('.', ',') + ' trigo/h · ' + r.ervas.toFixed(1).replace('.', ',') + ' ervas/h'; break;
        case 'lenharia': t = r.madeira.toFixed(1).replace('.', ',') + ' madeira/h'; break;
        case 'pedreira': t = r.pedra.toFixed(1).replace('.', ',') + ' pedra/h · ' + r.minerio.toFixed(1).replace('.', ',') + ' minério/h'; break;
        case 'estabulo': t = (1 + l) + ' baias · ' + r.racao.toFixed(1).replace('.', ',') + ' ração/h · estoque ' + G.resCap('racao') + ' · doma até ' + G.MOUNT_IDS.filter((k) => G.MOUNTS[k].est <= l).map((k) => G.MOUNTS[k].name.split(' ')[0]).pop(); break;
      }
    } finally { if (!save) delete G.S.b[id]; else save.lvl = had; }
    return t;
  };
  const REP = { servicos: 'Serviços aos heróis', forja: 'Vendas da forja', pocoes: 'Poções', treino: 'Campo de Treino', exportacao: 'Mercado e exportações', dizimo: 'Dízimo do comércio', chefes: 'Recompensas de chefes', mare: 'Maré da Fenda', fenda: 'Fenda Infinita', contratos: 'Contratos', missoes: 'Jornada', eventos: 'Eventos', reino: 'Nível do Reino',
    '-obras': 'Obras', '-forja': 'Custos da forja', '-salarios': 'Salários', '-recrutas': 'Portal', '-promocao': 'Promoções', '-cura': 'Enfermaria', '-mercado': 'Compras no mercado', '-decretos': 'Decretos', '-eventos': 'Eventos', '-saque': 'Saque da Maré', '-arena': 'Loja da Arena' };

  /* ================= REINO ================= */
  const reino = {
    title: 'Reino', tabs: [['geral', 'Visão geral'], ['obras', 'Prédios'], ['decor', 'Decoração'], ['estabulo', 'Estábulo'], ['publicas', 'Obras públicas'], ['mercado', 'Mercado']],
    badge: { decor: () => G.DECOR.filter((d) => G.decorLvl(d.id) === 0 && G.canDecor(d.id).ok).length },
    render(tab, sub) {
      const S = G.S;
      if (tab === 'decor') return tabDecor();
      if (tab === 'estabulo') return tabEstabulo();
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
        const mats = Object.keys(S.res).filter((k) => G.RES[k] && G.BASE_RES.indexOf(k) < 0 && !G.RES[k].sp && S.res[k] >= 1);
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
        h += mascateCard();
        h += '<button class="tog" data-a="opt:autoSell"><span>Vender excedente automaticamente<small>O que não couber no armazém vai para o mercado por 70% do preço.</small></span><i class="sw' + (S.opts.autoSell ? ' on' : '') + '"></i></button>';
        h += '<div class="sec">Matéria-prima</div>';
        for (const id of G.BUYABLE) h += '<div class="card"><div class="row"><i class="px ri-' + id + '" style="width:28px;height:28px"></i><div class="gr"><h3>' + G.RES[id].name + ' <small>' + v.T(() => G.fmt(G.S.res[id] || 0)) + '</small></h3><p>Vende a ' + String(G.sellPrice(id)).replace('.', ',') + ' · compra a ' + String(G.buyPrice(id)).replace('.', ',') + '</p></div><button class="btn sm" data-a="sell:' + id + ':20" ' + v.Dis(() => (G.S.res[id] || 0) < 1) + '>Vender 20</button><button class="btn sm pri" data-a="buy:' + id + ':20" ' + v.Dis(() => G.S.gold < G.buyPrice(id) * 20) + '>Comprar 20</button></div></div>';
        const mats = Object.keys(S.res).filter((k) => G.RES[k] && G.BASE_RES.indexOf(k) < 0 && !G.RES[k].sp && S.res[k] >= 1);
        h += '<div class="sec">Espólio</div>';
        if (!mats.length) h += '<div class="empty">Nenhum espólio no armazém ainda.</div>';
        for (const id of mats) h += '<div class="card"><div class="row"><i class="px ri-' + id + '" style="width:28px;height:28px"></i><div class="gr"><h3>' + G.RES[id].name + ' <small>' + v.T(() => G.fmt(G.S.res[id] || 0)) + '</small></h3><p>Vende a ' + String(G.sellPrice(id)).replace('.', ',') + ' cada</p></div><button class="btn sm" data-a="sell:' + id + ':10" ' + v.Dis(() => (G.S.res[id] || 0) < 1) + '>Vender 10</button><button class="btn sm" data-a="sell:' + id + ':half" ' + v.Dis(() => (G.S.res[id] || 0) < 2) + '>Metade</button></div></div>';
        return h;
      }
      return '';
    },
    after(tab, sub) { if (tab === 'obras' && sub && sub.bld) { const el = document.getElementById('bc-' + sub.bld); if (el) el.scrollIntoView({ block: 'center' }); sub.bld = null; } },
  };

  /* ================= HERÓIS (v20: lista em cartões e ficha com abas) ================= */
  const BONUS_LBL = { hp: 'vida', atk: 'ataque', def: 'defesa', crit: 'crítico', eva: 'esquiva', aspd: 'vel. de ataque', spd: 'movimento', cdr: 'recarga mais rápida', critDmg: 'dano crítico', gold: 'moedas', drop: 'espólio', xp: 'experiência', heal: 'cura', elite: 'dano em elites e chefes', thorns: 'dano devolvido', mood: 'ânimo natural' };
  const bonusText = (p, f) => { const a = []; for (const k in p) a.push(k === 'rng' ? '+' + String(p[k]).replace('.', ',') + ' de alcance' : '+' + Math.round(p[k] * (f || 1) * 100) + '% ' + BONUS_LBL[k]); return a.join(' · '); };
  const inl = (name) => ic(name).replace('class="i"', 'class="i" style="display:inline;vertical-align:-2px"');
  const rarTag = (r) => '<i class="rtag rar' + r + '">' + G.RAR[r][0] + '</i>';
  const stars = (x) => (x.stars ? ' <span class="gold">' + '★'.repeat(Math.min(5, x.stars)) + (x.stars > 5 ? '×' + x.stars : '') + '</span>' : '');
  const heroFlag = (x) => G.canPromote(x) || G.canRebirth(x) || G.canJob(x) || G.canWake(x) || (G.rbFresh && G.rbFresh(x));
  const mountURLs = {};
  const mountImg = (k, size) => { if (!mountURLs[k]) { const cv = A.mk(30, 22); cv.getContext('2d').drawImage(A.mountSheet(k), 0, 0, 30, 22, 0, 0, 30, 22); mountURLs[k] = cv.toDataURL(); } return '<i class="px mimg" style="width:' + (size || 60) + 'px;height:' + Math.round((size || 60) * 22 / 30) + 'px;background-image:url(' + mountURLs[k] + ')"></i>'; };
  const decURLs = {};
  const decImg = (d) => { const l = Math.max(1, G.decorLvl(d.id)), k = d.id + l; if (!decURLs[k]) { const s = A.prop(d.spr, d.id === 'canteiros' ? 0 : l - 1); decURLs[k] = s ? s.cv.toDataURL() : ''; } return decURLs[k]; };

  const herois = {
    title: 'Heróis', tabs: [],
    render(tab, sub) {
      const S = G.S;
      const h0 = sub && sub.hero ? S.heroes.find((x) => x.id === sub.hero) : null;
      if (h0) return heroDetail(h0, sub.ht || 'ficha');
      let h = '<div class="card hl"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:22px;color:var(--epic)">' + ic('portal') + '</span><div class="gr"><h3>Portal de Aurora <small>' + S.heroes.length + ' / ' + G.heroCap() + ' heróis</small></h3><p>' + (S.heroes.length >= G.heroCap() ? 'Sem camas livres. Melhore a Hospedaria.' : 'O Portal revela três viajantes. Você escolhe um.') + '</p></div><button class="btn vio" data-a="portal">Abrir</button></div></div>';
      /* ordens em massa */
      const allOrder = S.heroes.length && S.heroes.every((x) => x.order === S.heroes[0].order) ? S.heroes[0].order : null;
      h += '<div class="card"><p style="margin:0 0 6px">' + inl('target') + ' Campo de caça de todos</p><div class="chips"><button data-a="orderall:auto" class="' + (allOrder === 'auto' ? 'on' : '') + '">Automático</button>' + G.ZONES.filter(G.zoneUnlocked).map((z) => '<button data-a="orderall:' + z.id + '" class="' + (allOrder === z.id ? 'on' : '') + '">' + z.name.split(' ')[0] + ' · Nv ' + G.zoneLvl(z, S.zones[z.id].tier) + '</button>').join('') + '</div>' +
        '<div class="row" style="margin-top:10px"><div class="gr"><p style="margin:0 0 6px">' + inl('sort') + ' Ordenar caçadores</p><div class="chips">' + G.HSORT.map(([id, l]) => '<button data-a="hsort:' + id + '" class="' + ((S.opts.hsort || 'padrao') === id ? 'on' : '') + '">' + l + '</button>').join('') + '</div></div></div>' +
        '<button class="btn wide" style="margin-top:10px" data-a="hhealall" ' + v.Dis(() => { const c = G.healAllCost(); return !c || G.S.gold < c; }) + '>' + ic('heart') + 'Curar todos · ' + v.T(() => G.fmt(G.healAllCost())) + ' moedas</button></div>';
      h += '<div class="hgrid">';
      for (const x of G.sortedHeroes()) {
        h += '<div class="hcard" style="border-color:' + G.RANK_COLOR[x.rank] + '"><button class="hc-top" data-a="herod:' + x.id + '"><span class="hc-nm">' + rank(x.rank) + '<b>' + esc(x.name) + '</b>' + rarTag(x.rar) + '</span><span class="hc-sub">' + v.T(() => 'Nv.' + x.lvl) + ' <span style="color:' + G.CLASSES[x.cls].color + '">' + G.heroTitle(x) + '</span>' + stars(x) + '</span>' + (UI.hTitle ? UI.hTitle(x, 1) : '') +
          '<i class="px hc-pt" style="background-image:url(' + A.fullBody(A.heroLook(x)) + ')"></i>' + (heroFlag(x) ? '<span class="pill gold hc-up">' + ic('up') + '</span>' : (x.ap || 0) > 0 ? '<span class="pill hc-up" style="color:var(--epic)">' + ic('book') + x.ap + '</span>' : '') +
          '<span class="mini">' + bar(() => Math.round(100 * Math.max(0, x.hp) / G.heroStats(x).hp), 'g') + bar(() => Math.round(x.fome), 'o') + bar(() => Math.round(x.animo), 'p') + bar(() => Math.round(x.energia), 'b') + '</span><span class="hc-st">' + v.T(() => G.stateLabel(x) + (x.noZone ? ' · sem zona segura!' : '')) + '</span></button>' +
          '<div class="hc-btns"><button class="btn sm" data-a="hheal:' + x.id + '" ' + v.Dis(() => { const c = G.healCost(x); return !c || G.S.gold < c; }) + '>' + ic('heart') + v.T(() => (x.state === 'recover' || x.state === 'fallen' ? 'Reerguer' : 'Curar')) + '</button><button class="btn sm" data-a="herod:' + x.id + '">Info</button><button class="btn sm loc" data-a="follow:' + x.id + '">' + ic('target') + '</button></div></div>';
      }
      return h + '</div><p class="mut" style="text-align:center;font-size:11px;margin-top:8px">Barras: vida · saciedade · ânimo · vigor</p>';
    },
    subTitle(sub) { const h = sub && sub.hero ? G.S.heroes.find((x) => x.id === sub.hero) : null; return h ? h.name : null; },
  };

  const HTABS = [['ficha', 'scroll', 'Ficha'], ['habil', 'spark', 'Habilidades'], ['artes', 'book', 'Artes'], ['mont', 'shoe', 'Montaria'], ['bolsa', 'bag', 'Bolsa'], ['feitos', 'trophy', 'Feitos']];
  const dollSlot = (x, slot) => {
    const it = x.gear[slot], type = G.slotType(x, slot);
    return it ? '<button class="ds" data-a="item:' + it.id + ':' + x.id + '">' + gi(it) + '<small>' + G.SLOT[slot] + '</small></button>'
      : '<button class="ds vz" data-a="slotinfo:' + slot + ':' + x.id + '"><i class="gi px gi-' + type + '"></i><small>' + G.SLOT[slot] + '</small></button>';
  };
  const heroDetail = (x, tab) => {
    const look = A.heroLook(x);
    let h = '<div class="card hl"><div class="row"><div class="gr"><h3 style="font-size:16px">' + rank(x.rank) + ' ' + esc(x.name) + stars(x) + '</h3><p><span class="rar' + x.rar + '" style="font-weight:800">' + G.RAR[x.rar] + '</span> · ' + G.heroTitle(x) + ' · ' + v.T(() => 'Nível ' + x.lvl + ' / ' + G.RANK_CAP[x.rank]) + '</p>' + (UI.hTitle ? UI.hTitle(x) : '') + '</div><span class="cost" title="Bolsa do herói">' + ic('coin') + v.T(() => G.fmt(x.gold)) + '</span></div>' +
      dollV21(x, look) +
      '<div class="xpl">' + bar(() => Math.round(100 * x.xp / G.xpNeed(x.lvl)), 'big p') + '<b>' + v.T(() => 'EXP ' + G.fmt(x.xp) + '/' + G.fmt(G.xpNeed(x.lvl))) + '</b></div>' +
      '<div class="row" style="margin-top:8px"><span class="gr mut" style="font-size:12px">' + v.T(() => G.stateLabel(x)) + '</span><button class="btn sm" data-a="follow:' + x.id + '">' + ic('eye') + 'Seguir</button><span ' + v.At('style', () => (x.state === 'recover' || x.state === 'fallen' ? '' : 'display:none')) + '><button class="btn sm red" data-a="revive:' + x.id + '" ' + v.Dis(() => G.S.gold < G.price(x, 'revive') * 2) + '>' + ic('heart') + 'Reerguer · ' + G.fmt(G.price(x, 'revive') * 2) + '</button></span></div></div>';
    const tb = { ficha: () => (G.canPromote(x) || G.canRebirth(x) || G.canWake(x) ? 1 : 0), habil: () => (G.canJob(x) ? 1 : 0), artes: () => x.ap || 0 };
    h += '<div class="htabs">' + HTABS.map(([id, i, l]) => '<button data-a="htab:' + id + '" class="' + (id === tab ? 'on' : '') + '">' + ic(i) + '<span>' + l + '</span>' + (tb[id] ? v.Badge(tb[id], id === 'artes' ? 'vio' : '') : '') + '</button>').join('') + '</div>';
    return h + (tab === 'feitos' && UI.feitosTab ? UI.feitosTab(x) : tab === 'habil' ? tabHabil(x) : tab === 'artes' ? tabArtes(x) : tab === 'mont' ? tabMont(x) : tab === 'bolsa' ? tabBolsa(x) : tabFicha(x));
  };

  /* ---------- aba Ficha ---------- */
  const tabFicha = (x) => {
    const S = G.S, c = G.CLASSES[x.cls], st = () => G.heroStats(x);
    let h = '<div class="card"><div class="row"><div class="gr"><h3 class="cz rar' + x.rar + '" style="font-size:17px;letter-spacing:.08em">' + G.RAR[x.rar].toUpperCase() + '</h3><p style="margin-top:0">Nv.' + v.T(() => x.lvl) + ' <b style="color:' + c.color + '">' + G.heroTitle(x) + '</b></p></div><div style="text-align:right"><small class="mut" style="font-weight:800;letter-spacing:.06em">DPS</small><br><b style="font-size:17px">' + v.T(() => G.fmt(G.heroDps(x))) + '</b></div></div>' +
      '<div class="fgrid"><div><div class="need">' + ic('heart') + '<span class="nb">' + bar(() => Math.round(100 * Math.max(0, x.hp) / st().hp), 'big r') + '<i>' + v.T(() => 'HP ' + G.fmt(Math.max(0, x.hp)) + '/' + G.fmt(st().hp)) + '</i></span></div><div class="need">' + ic('meal') + '<span class="nb">' + bar(() => Math.round(x.fome), 'big o') + '<i>' + v.T(() => 'Saciedade ' + Math.round(x.fome) + '/100') + '</i></span></div><div class="need">' + ic('smile') + '<span class="nb">' + bar(() => Math.round(x.animo), 'big g') + '<i>' + v.T(() => 'Ânimo ' + Math.round(x.animo) + '/100') + '</i></span></div><div class="need">' + ic('zzz') + '<span class="nb">' + bar(() => Math.round(x.energia), 'big b') + '<i>' + v.T(() => 'Vigor ' + Math.round(x.energia) + '/100') + '</i></span></div></div>' +
      '<div class="fst"><div>' + ic('sword') + '<span>ATQ</span><b>' + v.T(() => G.fmt(st().atk)) + '</b></div><div>' + ic('shield') + '<span>DEF</span><b>' + v.T(() => G.fmt(st().def)) + '</b></div><div>' + ic('target') + '<span>CRÍT</span><b>' + v.T(() => pct(st().crit)) + '</b></div><div>' + ic('bolt') + '<span>VEL ATQ</span><b>' + v.T(() => (1 / st().int).toFixed(2).replace('.', ',')) + '</b></div><div>' + ic('run') + '<span>Evasão</span><b>' + v.T(() => pct(st().eva)) + '</b></div></div></div>' +
      '<div class="grid3" style="margin-top:8px"><div class="stat"><small>Dano crít.</small><b>' + v.T(() => pct(st().critDmg)) + '</b></div><div class="stat"><small>Aguenta até</small><b>' + v.T(() => 'Nv ' + st().eff) + '</b></div><div class="stat"><small>Abates · quedas</small><b>' + v.T(() => G.fmt(x.kills) + ' · ' + x.falls) + '</b></div></div>';
    if (UI.insHero) h += UI.insHero(x);
    /* Despertar */
    const w = G.wakeNext(x), wk = x.wake || 0;
    h += '<div class="wake' + (G.canWake(x) ? ' rdy' : '') + '"><div class="row"><b class="gr">Despertar</b><span class="pips">' + [0, 1, 2, 3].map((i) => '<i class="' + (i < wk ? 'on' : '') + '">' + ic('spark') + '</i>').join('') + '</span><b>' + wk + ' / 4</b></div>' +
      (w ? '<p><b class="gold">' + w.name + '</b> · +8% em vida, ataque e defesa · ' + w.perk + '.</p>' + (G.wakeReady(x) ? '<div class="row" style="margin-top:2px"><div class="gr">' + cost(w.gold, w.cost) + '</div><button class="btn vio" data-a="wake:' + x.id + '" ' + v.Dis(() => !G.canWake(x)) + '>' + ic('spark') + 'Despertar</button></div>' : '<p class="bad">Requer Rank ' + G.RANKS[w.rank] + (w.rank === 7 ? ' (ou um renascimento)' : '') + '.</p>') : '<p class="gold">Despertar completo: +32% em vida, ataque e defesa.</p>') + '</div></div>';
    h += '<p class="mut" style="font-size:12px;margin:2px 2px 0">' + inl('potion') + ' ' + v.T(() => x.potions + ' / ' + G.potCap(x)) + ' poções · espólio ' + v.T(() => x.bagN + ' / ' + G.bagCap(x)) + '</p>';
    /* ordens */
    h += '<div class="sec">Ordens</div><div class="card"><p style="margin:0 0 6px">Onde caçar</p><div class="chips"><button data-a="order:' + x.id + ':auto" class="' + (x.order === 'auto' ? 'on' : '') + '">Automático</button>' + G.ZONES.filter(G.zoneUnlocked).map((z) => '<button data-a="order:' + x.id + ':' + z.id + '" class="' + (x.order === z.id ? 'on' : '') + '">' + z.name.split(' ')[0] + ' · Nv ' + G.zoneLvl(z, S.zones[z.id].tier) + '</button>').join('') + '</div><p style="margin:10px 0 6px">Cautela — quando recuar</p><div class="seg">' + G.CAUTION.map((cc, i) => '<button data-a="caution:' + x.id + ':' + i + '" class="' + (x.caution === i ? 'on' : '') + '">' + cc.name + '</button>').join('') + '</div><p>' + ['Recua só com 20% de vida e encara chefes mais fortes. Mais abates, mais quedas.', 'Recua com 35% de vida. Entra em chefes quando aguenta ou tem companhia.', 'Recua com 50% de vida e nunca enfrenta chefes. Seguro, porém lento.'][x.caution] + '</p></div>';
    /* promoção */
    const q = G.promoReq(x);
    h += '<div class="sec">Carreira</div>';
    if (G.canRebirth(x) && UI.rebCard) h += UI.rebCard(x);
    if (G.canRebirth(x) && !UI.rebCard) h += '<div class="card hl"><h3>Renascimento</h3><p>' + esc(x.name) + ' volta ao nível 1, Rank E, com +30% em todos os atributos para sempre. Mantém equipamento, vocação, Artes e Despertar, e ganha 15 pontos de Arte.</p><button class="btn vio wide" style="margin-top:8px" data-a="rebirth:' + x.id + '">' + ic('star') + 'Renascer sob as Duas Luas</button></div>';
    else if (q) h += '<div class="card"><h3>Promoção a Rank ' + G.RANKS[x.rank + 1] + ' <small>atributos ×' + (G.RANK_MULT[x.rank + 1] / G.RANK_MULT[x.rank]).toFixed(2).replace('.', ',') + ' · nível máximo ' + G.RANK_CAP[x.rank + 1] + '</small></h3><div class="kv"><span>Nível ' + q.lvl + '</span><b ' + v.At('class', () => (x.lvl >= q.lvl ? 'good' : 'bad')) + '>' + v.T(() => x.lvl + ' / ' + q.lvl) + '</b></div><div class="kv"><span>Guilda nível ' + q.guilda + '</span><b class="' + (G.bLvl('guilda') >= q.guilda ? 'good' : 'bad') + '">' + G.bLvl('guilda') + ' / ' + q.guilda + '</b></div><div class="row" style="margin-top:4px"><div class="gr">' + cost(q.gold, q.cost) + '</div><button class="btn pri" data-a="promote:' + x.id + '" ' + v.Dis(() => !G.canPromote(x)) + '>' + ic('up') + 'Promover</button></div></div>';
    else if (!(UI.rebCard && G.canRebirth(x))) h += '<div class="card"><p>Rank máximo. Alcance o nível ' + G.REB.lvl + ' para renascer.</p></div>';
    if (UI.rebPrev) h += UI.rebPrev(x);
    h += '<div class="sec">Traços</div>';
    if (UI.rebTraits) h += UI.rebTraits(x); else for (const t of x.traits) h += '<div class="trait"><b>' + G.TRAITS[t].name + '</b><span>' + G.TRAITS[t].desc + '</span></div>';
    h += '<button class="btn wide" style="margin-top:10px;color:#ff9a9a" data-a="dismiss:' + x.id + '">' + ic('trash') + 'Dispensar ' + esc(x.name) + '</button>';
    return h;
  };

  /* ---------- aba Habilidades (árvore de vocação) ---------- */
  const skTile = (x, i, sk, col) => {
    const l = G.skillLvl(x, i), r = G.canSkillUp(x, i), c = G.skillUpCost(x, i), maxed = l >= 10;
    return '<div class="sk"><div class="row"><span class="ski" style="background:' + col + '">' + ic(skIcon(sk, x.cls)) + '<em>Nv.' + l + '</em></span><div class="gr"><b>' + sk.name + '</b><p>' + sk.desc + ' Recarga de ' + sk.cd + ' s.' + (l > 1 ? ' <span class="good">Força +' + Math.round((G.skillPow(x, i) - 1) * 100) + '%.</span>' : '') + '</p></div></div>' +
      (maxed ? '<p class="gold" style="margin-top:4px">Nível máximo.</p>' : '<div class="row" style="margin-top:2px"><div class="gr">' + cost(c.gold, c.cost) + '</div><button class="btn sm pri" data-a="skup:' + x.id + ':' + i + '" ' + v.Dis(() => !G.canSkillUp(x, i).ok) + '>' + ic('up') + 'Treinar</button></div>' + (r.ok || !r.why || r.why.indexOf('Faltam') === 0 ? '' : '<p class="bad" style="margin-top:4px">' + r.why + '.</p>')) + '</div>';
  };
  const jobOpt = (x, id, pickable) => {
    const j = G.JOBS[id], c = G.CLASSES[x.cls];
    return '<button class="sk opt2' + (pickable ? ' can' : ' off') + '" data-a="job:' + x.id + ':' + id + '"><div class="row"><span class="ski" style="background:' + (pickable ? c.color : '#3a3f55') + '">' + ic(skIcon(j.skill, x.cls)) + '<em>Nv.0</em></span><div class="gr"><b>' + j.skill.name + '</b><p>' + (pickable ? j.skill.desc : 'Disponível após a mudança de classe para <b style="color:' + c.color + '">' + j.name + '</b>') + '</p></div>' + (pickable ? ic('next') : ic('lock')) + '</div></button>';
  };
  const tabHabil = (x) => {
    const c = G.CLASSES[x.cls], ps = G.PASSIVES[x.cls], t = G.jobTier(x), ready = G.jobReady(x);
    let h = '<div class="sec">Habilidade básica</div>' + skTile(x, 0, c.skill, c.color) + '<div class="sk"><div class="row"><span class="ski" style="background:#4a5578">' + ic('shield') + '<em>pass.</em></span><div class="gr"><b>' + ps.name + '</b><p>' + ps.desc + ' Sempre ativa.</p></div></div></div>';
    /* 2ª habilidade */
    h += '<div class="sec">2ª habilidade</div>';
    if (x.j2) h += skTile(x, 1, G.JOBS[x.j2].skill, c.color);
    else { h += G.jobBranches(x.cls, 2).map((id) => jobOpt(x, id, ready)).join(''); if (!ready) h += '<p class="mut" style="font-size:11.5px;margin:0 2px">A primeira mudança de classe abre no <b class="gold">Rank C</b>.</p>'; }
    /* 3ª habilidade */
    h += '<div class="sec">3ª habilidade</div>';
    if (x.j3) h += skTile(x, 2, G.JOBS[x.j3].skill, c.color);
    else { h += G.jobBranches(x.cls, 3, x.j2).map((id) => jobOpt(x, id, !!x.j2 && ready)).join(''); if (!(x.j2 && ready)) h += '<p class="mut" style="font-size:11.5px;margin:0 2px">' + (x.j2 ? 'A segunda mudança de classe abre no <b class="gold">Rank A</b>.' : 'Escolha primeiro a 2ª classe. A segunda mudança abre no <b class="gold">Rank A</b>.') + '</p>'; }
    /* árvore */
    const node = (id, on, dim) => { const j = id ? G.JOBS[id] : null; return '<button class="node' + (on ? ' on' : '') + (dim ? ' dim' : '') + '"' + (id ? ' data-a="job:' + x.id + ':' + id + '"' : '') + ' style="' + (on ? 'border-color:' + c.color : '') + '"><b>' + (j ? j.name : c.name) + '</b><small>' + (j ? bonusText(j.p) : bonusText(ps.p)) + '</small></button>'; };
    const b2 = G.jobBranches(x.cls, 2);
    h += '<div class="sec">Árvore de vocação</div><div class="tree"><div class="tl">' + node(null, true) + '</div><div class="tarrow">' + ic('up') + '</div><div class="tl">' + b2.map((id) => node(id, x.j2 === id, x.j2 && x.j2 !== id)).join('') + '</div><div class="tarrow">' + ic('up') + '</div><div class="tl t4">' + b2.map((b) => '<div class="tcol">' + G.jobBranches(x.cls, 3, b).map((id) => node(id, x.j3 === id, (x.j2 && x.j2 !== b) || (x.j3 && x.j3 !== id))).join('') + '</div>').join('') + '</div></div>';
    if (t < 3) { const q = G.jobReq(t + 1); h += '<div class="card" style="margin-top:8px"><h3>' + (t === 1 ? '1ª' : '2ª') + ' mudança de classe</h3><div class="kv"><span>Rank ' + G.RANKS[q.rank] + ' ou superior</span><b class="' + (ready ? 'good' : 'bad') + '">Rank ' + G.RANKS[x.rank] + (x.stars ? ' ★' : '') + '</b></div>' + cost(q.gold, q.cost) + '<p>' + (ready ? 'Toque em uma das vocações acima para ver os detalhes e escolher.' : 'Os Tomos de Técnica caem de elites, chefes, da Fenda e da Maré.') + ' A escolha fecha o outro ramo.</p></div>'; }
    if (x.j2) h += '<button class="btn wide" style="margin-top:8px" data-a="jobreset:' + x.id + '" ' + v.Dis(() => G.S.selos < G.jobResetCost()) + '>' + ic('seal') + 'Trocar de vocação · ' + G.jobResetCost() + ' Selos</button>';
    return h;
  };
  const jobModal = (x, id) => {
    const j = G.JOBS[id], q = G.jobReq(j.t), opts = G.jobOptions(x), mine = x.j2 === id || x.j3 === id, pick = opts.indexOf(id) >= 0 && G.jobReady(x);
    UI.modal('<div class="eyebrow">' + (j.t === 2 ? '2ª classe' : '3ª classe') + ' · ' + G.CLASSES[j.base].name + '</div><h2>' + j.name + '</h2><p class="lead">' + j.desc + '</p><div class="trait"><b>' + j.skill.name + '</b><span>' + j.skill.desc + ' Recarga de ' + j.skill.cd + ' s.</span></div><div class="trait"><b>Passiva da vocação</b><span>' + bonusText(j.p) + '</span></div>' +
      (mine ? '<p class="lead good" style="font-weight:800">Vocação atual de ' + esc(x.name) + '.</p><div class="acts"><button class="btn pri" data-a="mclose">Fechar</button></div>'
        : pick ? UI.cost(q.gold, q.cost) + '<p class="lead" style="font-size:12px;margin-bottom:0">A escolha fecha o outro ramo. Trocar depois custa ' + G.jobResetCost() + ' Selos.</p><div class="acts"><button class="btn" data-a="mclose">Agora não</button><button class="btn pri" data-a="jobok:' + x.id + ':' + id + '"' + (G.canJob(x) ? '' : ' disabled') + '>' + ic('up') + 'Tornar-se ' + j.name + '</button></div>'
          : '<p class="lead bad" style="font-size:12.5px">' + (j.t === 3 && !x.j2 ? 'Vem depois de ' + G.JOBS[j.from].name + '.' : j.t === 3 && x.j2 !== j.from ? 'Pertence ao ramo de ' + G.JOBS[j.from].name + '.' : j.t <= G.jobTier(x) ? 'Este ramo foi fechado pela escolha atual.' : 'Requer Rank ' + G.RANKS[q.rank] + '.') + '</p><div class="acts"><button class="btn pri" data-a="mclose">Fechar</button></div>'), { pause: false });
  };

  /* ---------- aba Artes Secretas ---------- */
  let artStep = 1;
  const tabArtes = (x) => {
    let h = '<div class="card hl"><div class="row"><div class="gr"><h3>' + inl('book') + ' Artes Secretas</h3><p>Cada ponto reforça um aspecto do herói para sempre. Pontos vêm de níveis, promoções, chefes, vocações e meditação.</p></div></div><div class="grid2" style="margin-top:8px"><div class="stat"><small>Pontos disponíveis</small><b class="epic" style="font-size:18px">' + v.T(() => x.ap || 0) + '</b></div><div class="stat"><small>Pontos Secretos totais</small><b class="good" style="font-size:18px">' + v.T(() => G.artSpent(x)) + '</b></div></div>' +
      '<div class="row" style="margin-top:8px"><span class="mut" style="font-size:12px;font-weight:700">Por toque</span><div class="seg gr">' + [1, 5, 25].map((n) => '<button data-a="artstep:' + n + '" class="' + (artStep === n ? 'on' : '') + '">+' + n + '</button>').join('') + '</div></div></div>';
    h += '<div class="arts">';
    for (const a of G.ARTS) {
      const n = G.artLvl(x, a.id), val = Math.abs(a.per * n * 100);
      h += '<button class="arte' + (n >= G.ART_MAX ? ' max' : '') + '" data-a="art:' + x.id + ':' + a.id + '" ' + v.Dis(() => !(x.ap > 0) || G.artLvl(x, a.id) >= G.ART_MAX) + '><span class="ai">' + ic(a.icon) + (a.per < 0 ? '<i>' + ic('minus') + '</i>' : '') + '</span><b>' + a.name + '</b><em>' + n + '/' + G.ART_MAX + '</em><small>' + (a.per < 0 ? '−' : '+') + (val % 1 ? val.toFixed(1).replace('.', ',') : val) + '% ' + a.what.replace(/^de /, '') + '</small></button>';
    }
    h += '</div><div class="grid2" style="margin-top:8px"><button class="btn" data-a="artauto:' + x.id + '" ' + v.Dis(() => !(x.ap > 0)) + '>' + ic('check') + 'Distribuir pela classe</button><button class="btn" data-a="artbuy:' + x.id + '" ' + v.Dis(() => !G.bOk('treino') || G.S.gold < G.artBuyCost(x)) + '>' + ic('zzz') + 'Meditar +1 · ' + v.T(() => G.fmt(G.artBuyCost(x))) + '</button></div>' +
      (G.bOk('treino') ? '' : '<p class="mut" style="font-size:11.5px;text-align:center;margin-top:6px">A meditação guiada exige o Campo de Treino.</p>') +
      '<button class="tog" style="margin-top:4px" data-a="artautotog:' + x.id + '"><span>Distribuir sozinho<small>Cada ponto novo vai direto para as Artes da classe.</small></span><i class="sw' + (x.autoArt ? ' on' : '') + '"></i></button>' + '<button class="btn wide" style="margin-top:8px" data-a="artreset:' + x.id + '" ' + v.Dis(() => !G.artSpent(x) || G.S.selos < G.artResetCost()) + '>' + ic('seal') + 'Redistribuir tudo · ' + G.artResetCost() + ' Selo</button>';
    return h;
  };

  /* ---------- aba Montaria ---------- */
  const mountCard = (mt, x) => {
    const d = G.MOUNTS[mt.k], rider = G.S.heroes.find((q) => q.mount === mt.id);
    return '<div class="card"><div class="row">' + mountImg(mt.k, 66) + '<div class="gr"><h3 class="rar' + d.rar + '">' + d.name + ' <span class="lvl">Nv ' + mt.lvl + '</span></h3><p>' + bonusText(d.p, G.mountF(mt)) + ' · +' + d.bag + ' de bolsa' + (G.S.stable.hungry ? ' <span class="bad">(com fome: metade)</span>' : '') + '</p>' + (mt.lvl < G.MOUNT_MAX ? '<div style="margin-top:5px">' + bar(() => Math.round(100 * mt.xp / G.mountNeed(mt)), 'o') + '</div><p>' + v.T(() => mt.xp + ' / ' + G.mountNeed(mt)) + ' de ração para o nível ' + (mt.lvl + 1) + '</p>' : '<p class="gold">Nível máximo.</p>') + '</div></div>' +
      '<div class="row" style="margin-top:8px">' + (mt.lvl < G.MOUNT_MAX ? '<button class="btn sm" data-a="mfeed:' + mt.id + ':1" ' + v.Dis(() => (G.S.res.racao || 0) < 1) + '><i class="px ri-racao" style="width:16px;height:16px"></i>+1</button><button class="btn sm" data-a="mfeed:' + mt.id + ':10" ' + v.Dis(() => (G.S.res.racao || 0) < 1) + '><i class="px ri-racao" style="width:16px;height:16px"></i>+10</button>' : '') + '<span class="gr"></span>' +
      (x ? '<button class="btn sm" data-a="mrider:' + mt.id + ':0">Desmontar</button>' : '<button class="btn sm" data-a="mride:' + mt.id + '">' + ic('people') + (rider ? esc(rider.name) : 'Sem cavaleiro') + '</button><button class="btn sm" style="color:#ff9a9a" data-a="mfree:' + mt.id + '">' + ic('trash') + '</button>') + '</div></div>';
  };
  const tabMont = (x) => {
    const S = G.S, mt = G.mountOf(x);
    if (mt) return '<div class="sec">Montaria de ' + esc(x.name) + '</div>' + mountCard(mt, x) + '<p class="mut" style="font-size:11.5px;text-align:center">Cada montaria em uso come 1 ração por dia. Ração no Estábulo: ' + v.T(() => Math.floor(G.S.res.racao || 0)) + '.</p>';
    const free = S.stable.list.filter((m) => !S.heroes.some((q) => q.mount === m.id));
    let h = '<div class="empty" style="padding:22px 10px 12px"><b style="color:var(--text);font-size:14.5px">Nenhum animal de montaria foi montado.</b><br><br>' + (G.bLvl('estabulo') ? 'Montarias aceleram a viagem, aumentam a bolsa e dão bônus de combate.' : 'Construa o Estábulo (Cidadela nível 3) para domar montarias.') + '<br><br><button class="btn pri" data-a="open:reino:' + (G.bLvl('estabulo') ? 'estabulo' : 'obras') + '">' + ic('shoe') + 'Ir para o Estábulo</button></div>';
    if (free.length) { h += '<div class="sec">Livres no Estábulo</div>'; for (const m of free) { const d = G.MOUNTS[m.k]; h += '<div class="card"><div class="row">' + mountImg(m.k, 54) + '<div class="gr"><h3 class="rar' + d.rar + '">' + d.name + ' <span class="lvl">Nv ' + m.lvl + '</span></h3><p>' + bonusText(d.p, G.mountF(m)) + ' · +' + d.bag + ' de bolsa</p></div><button class="btn sm pri" data-a="mrider:' + m.id + ':' + x.id + '">Montar</button></div></div>'; } }
    return h;
  };
  const riderModal = (mt) => {
    const d = G.MOUNTS[mt.k];
    let h = '<div class="eyebrow">Estábulo do Vale</div><h2>' + d.name + '</h2><p class="lead">Quem vai montar? ' + bonusText(d.p, G.mountF(mt)) + '.</p><button class="opt" data-a="mrider:' + mt.id + ':0"><b>Ninguém</b><span>Fica descansando na baia.</span></button>';
    for (const x of G.S.heroes) { const cur = G.mountOf(x); h += '<button class="opt" data-a="mrider:' + mt.id + ':' + x.id + '"><b>' + rank(x.rank) + ' ' + esc(x.name) + ' <span class="mut" style="font-weight:700">Nv ' + x.lvl + ' · ' + G.heroTitle(x) + '</span></b><span>' + (cur ? (cur === mt ? 'Cavaleiro atual' : 'Monta ' + G.MOUNTS[cur.k].name + ' — troca de montaria') : 'A pé') + '</span></button>'; }
    UI.modal(h + '<div class="acts"><button class="btn" data-a="mclose">Cancelar</button></div>', { pause: false });
  };

  /* ---------- aba Bolsa ---------- */
  const tabBolsa = (x) => {
    const ks = Object.keys(x.bag).filter((k) => x.bag[k] > 0);
    let h = '<div class="sec">Material <span class="mut" style="letter-spacing:0;text-transform:none;font-family:inherit">' + x.bagN + ' / ' + G.bagCap(x) + '</span></div>';
    h += ks.length ? '<div class="bagg">' + ks.map((k) => '<span class="bi" title="' + G.RES[k].name + '"><i class="px ri-' + k + '"></i><b>' + x.bag[k] + '</b><small>' + G.RES[k].name.split(' ')[0] + '</small></span>').join('') + '</div>' : '<div class="empty">Bolsa vazia. O espólio aparece aqui até ser entregue na Guilda.</div>';
    h += '<div class="sec">Provisões</div><div class="grid3"><div class="stat"><small>Poções</small><b>' + v.T(() => x.potions + ' / ' + G.potCap(x)) + '</b></div><div class="stat"><small>Moedas</small><b class="gold">' + v.T(() => G.fmt(x.gold)) + '</b></div><div class="stat"><small>Espólio</small><b>' + v.T(() => x.bagN + ' / ' + G.bagCap(x)) + '</b></div></div>' +
      '<p class="mut" style="font-size:11.5px;margin:8px 2px">O herói volta sozinho quando a bolsa enche. As moedas dele viram suas quando ele gasta na cidade.</p>' +
      petBagSec(x) + '<button class="btn wide" style="margin-top:10px" data-a="recall:' + x.id + '" ' + v.Dis(() => x.state !== 'hunt' && x.state !== 'travel') + '>' + ic('castle') + 'Chamar de volta à cidade</button>';
    return h;
  };

  /* ================= REINO › Decoração e Estábulo ================= */
  const tabDecor = () => {
    const ch = G.charm();
    let h = '<div class="card hl"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:22px;color:#ff9ac8">' + ic('flower') + '</span><div class="gr"><h3>Encanto de Aurora <span class="lvl">' + ch + '</span></h3><p>Cada ponto de Encanto rende +1% de dízimo; a cada 10, a cidade abriga mais um morador. Cada enfeite ainda dá um bônus próprio e aparece na praça.</p></div></div></div>';
    let locked = '';
    for (const d of G.DECOR) {
      const l = G.decorLvl(d.id), r = G.canDecor(d.id), c = G.decorCost(d.id, l + 1);
      const val = (n) => (d.pct ? '+' + Math.round(d.per * n * 100) + '%' : '+' + d.per * n) + d.unit;
      if (G.bLvl('cidadela') < d.cid) { locked += '<div class="card lock"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:20px">' + ic('lock') + '</span><div class="gr"><h3>' + d.name + '</h3><p>Requer Cidadela nível ' + d.cid + '. ' + val(1) + ' por nível.</p></div></div></div>'; continue; }
      h += '<div class="card"><div class="row"><i class="thumb px" style="background-image:url(' + decImg(d) + ');background-size:contain"' + (l ? ' data-a="goto:' + G.decorSpots(d)[0][0] + ':' + G.decorSpots(d)[0][1] + '"' : '') + '></i><div class="gr"><h3>' + d.name + (l ? ' <span class="lvl">Nv ' + l + '</span>' : ' <span class="pill gold">novo</span>') + '</h3><p>' + d.desc + '</p><p>' + (l ? 'Agora: <b class="gold">' + val(l) + '</b> · ' : '') + 'Encanto +' + d.charm + ' por nível</p></div></div>' +
        (l >= G.DECOR_MAX ? '<p class="gold" style="margin-top:6px">No nível máximo.</p>' : '<p style="margin-top:6px"><b class="good">Nv ' + (l + 1) + ':</b> ' + val(l + 1) + '</p><div class="row" style="margin-top:2px"><div class="gr">' + cost(c.gold, c.cost) + '</div><button class="btn pri" data-a="decor:' + d.id + '" ' + v.Dis(() => !G.canDecor(d.id).ok) + '>' + ic(l ? 'up' : 'hammer') + (l ? 'Ampliar' : 'Colocar') + '</button></div>') + (l && G.decorMovable(d.id) ? '<div class="row" style="margin-top:8px"><span class="gr mut" style="font-size:11.5px">' + (G.S.decorPos[d.id] ? 'No lugar que você escolheu.' : 'No lugar original.') + '</span>' + (G.S.decorPos[d.id] ? '<button class="btn sm" data-a="decreset:' + d.id + '">Restaurar</button>' : '') + '<button class="btn sm" data-a="decmove:' + d.id + '">' + ic('map') + 'Mover</button></div>' : '') + '</div>';
      void r;
    }
    return h + (locked ? '<div class="sec">Em breve</div>' + locked : '');
  };
  const tabEstabulo = () => {
    const S = G.S, L = G.bLvl('estabulo');
    if (!L) return '<div class="empty">' + ic('shoe').replace('class="i"', 'class="i" style="font-size:28px;margin:0 auto 8px"') + (G.bAvailable('estabulo') ? 'O Estábulo do Vale ainda não foi erguido. Ele fica ao norte das muralhas.' : 'O Estábulo do Vale abre com a Cidadela no nível 3.') + '<br><br><button class="btn pri" data-a="open:reino:obras">Ver construções</button></div>';
    const riders = S.heroes.filter((x) => x.mount).length;
    let h = '<div class="card hl"><div class="grid3"><div class="stat"><small>Baias</small><b>' + S.stable.list.length + ' / ' + G.stallCap() + '</b></div><div class="stat"><small>Ração</small><b>' + v.T(() => Math.floor(G.S.res.racao || 0) + ' / ' + G.resCap('racao')) + '</b></div><div class="stat"><small>Consumo por dia</small><b>' + riders + '</b></div></div><p style="margin-top:8px">Tomé transforma 2 trigo em 1 ração (' + G.racaoRate().toFixed(1).replace('.', ',') + ' por hora, das 5h às 21h). Ração alimenta as montarias em uso e as faz subir de nível.' + (S.stable.hungry ? ' <b class="bad">Faltou ração hoje: as montarias rendem a metade.</b>' : '') + '</p></div>';
    h += '<div class="sec">Suas montarias</div>';
    if (!S.stable.list.length) h += '<div class="empty">Nenhuma montaria ainda. Dome a primeira logo abaixo.</div>';
    for (const mt of S.stable.list) h += mountCard(mt, null);
    h += '<div class="sec">Domar</div>';
    for (const k of G.MOUNT_IDS) {
      const d = G.MOUNTS[k], r = G.canTame(k), lockd = L < d.est;
      h += '<div class="card' + (lockd ? ' lock' : '') + '"><div class="row">' + mountImg(k, 60) + '<div class="gr"><h3 class="rar' + d.rar + '">' + d.name + ' <small>' + G.RAR[d.rar] + '</small></h3><p>' + d.desc + '</p><p><b class="gold">' + bonusText(d.p) + '</b> · +' + d.bag + ' de bolsa</p></div></div>' + (lockd ? '<p class="bad" style="margin-top:6px">Requer Estábulo nível ' + d.est + '.</p>' : '<div class="row" style="margin-top:2px"><div class="gr">' + cost(d.gold, d.cost) + '</div><button class="btn pri" data-a="tame:' + k + '" ' + v.Dis(() => !G.canTame(k).ok) + '>' + ic('shoe') + 'Domar</button></div>' + (!r.ok && r.why === 'Sem baias livres' ? '<p class="bad" style="margin-top:4px">Sem baias livres. Melhore o Estábulo.</p>' : '')) + '</div>';
    }
    return h;
  };
  const mascateCard = () => {
    const S = G.S, ms = S.mascate; if (!ms.offers.length) return '';
    let h = '<div class="card hl"><h3>' + inl('bag') + ' Mascate errante <small>ofertas de hoje</small></h3><p>Passa pelo Mercado todo amanhecer com quatro raridades. O que não for comprado vai embora com ele.</p>';
    ms.offers.forEach((o, i) => {
      const nm = o.id === 'ovo' ? 'Ovo de mascote ' + G.RAR[o.rar] : o.id === 'nucleos' ? 'Núcleo' : G.RES[o.id].name, icn = o.id === 'ovo' ? '<i class="px" style="width:28px;height:28px;background-image:url(' + A.eggURL(o.rar) + ')"></i>' : o.id === 'nucleos' ? '<span style="font-size:22px;color:#c8a0ff;width:28px;display:grid;place-items:center">' + ic('core') + '</span>' : '<i class="px ri-' + o.id + '" style="width:28px;height:28px"></i>';
      h += '<div class="row" style="margin-top:8px">' + icn + '<div class="gr"><b style="font-size:12.5px">' + o.n + '× ' + nm + '</b></div><button class="btn sm ' + (o.selos ? 'vio' : 'pri') + '" data-a="masc:' + i + '" ' + v.Dis(() => !!G.S.mascate.offers[i].sold || (o.selos ? G.S.selos < o.selos : G.S.gold < o.gold)) + '>' + (o.sold ? ic('check') + 'Comprado' : o.selos ? ic('seal') + o.selos : ic('coin') + G.fmt(o.gold)) + '</button></div>';
    });
    return h + '</div>';
  };

  /* ================= ARMAZÉM DA CIDADE ================= */
  let whSlot = 'todos';
  const SP_INFO = { tomo: 'Sobe o nível das habilidades e paga as mudanças de classe. Cai de elites, chefes, Fenda e Maré.', alma: 'Usado no Despertar e na 2ª mudança de classe. Vem de chefes, da Maré e da Fenda.', po_estelar: 'Cai de elites, chefes e da Fenda, e sobra do desmonte de peças Incomuns ou melhores. Usado no Despertar.', racao: 'Feita no Estábulo com trigo. Alimenta e evolui as montarias.', essencia: 'Vem da Fenda Infinita. Forja equipamentos Ascendentes.', po_reforja: 'Sai do desmonte de peças (quanto mais rara, mais pó). Paga a Reforja: sorteie de novo as inscrições de uma peça e escolha entre manter ou aceitar.' };
  const whEquip = () => {
    const S = G.S, cap = G.invCap();
    let h = '<div class="card hl"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:22px;color:var(--gold2)">' + ic('chest') + '</span><div class="gr"><h3>Armazém da Cidade <small>' + S.inv.length + ' / ' + cap + '</small></h3>' + bar(() => Math.min(100, Math.round(100 * G.S.inv.length / G.invCap())), 'big' + (S.inv.length >= cap ? ' r' : '')) + '<p>Tudo aqui fica à venda para os heróis. Peças <b>reservadas</b> ' + inl('lock') + ' não são vendidas nem desmontadas em lote.</p></div></div></div>';
    h += '<div class="chips" style="margin-bottom:8px"><button data-a="whslot:todos" class="' + (whSlot === 'todos' ? 'on' : '') + '">Tudo</button>' + G.SLOT_IDS.map((s) => '<button data-a="whslot:' + s + '" class="' + (whSlot === s ? 'on' : '') + '">' + G.SLOT[s] + '</button>').join('') + '</div>';
    const cnt = [0, 0, 0, 0, 0, 0]; for (const it of S.inv) if (!it.lock) cnt[it.rar]++;
    h += '<div class="dall"><span>Desmontar<br>tudo</span>' + G.RAR.map((n, r) => '<button class="rar' + r + '" data-a="dall:' + r + '"' + (cnt[r] ? '' : ' disabled') + '>' + n + (cnt[r] ? ' ' + cnt[r] : '') + '</button>').join('') + '</div>';
    const items = S.inv.filter((it) => whSlot === 'todos' || G.GEAR[it.type].kind === whSlot).sort((a, b) => b.tier - a.tier || b.rar - a.rar || b.plus - a.plus);
    if (!items.length) return h + '<div class="empty" style="padding:34px 10px"><b style="font-size:15px;color:var(--text)">Sem equipamentos no Armazém da Cidade.</b><br><br>' + (G.bLvl('ferraria') ? '<button class="btn pri" data-a="open:forja:forjar">' + ic('hammer') + 'Ir para a Forja</button>' : 'Construa a Ferraria para começar a forjar.') + '</div>';
    for (const it of items) {
      const y = G.dismantleYield(it);
      h += '<div class="card' + (it.lock ? ' lk' : '') + '"><div class="row">' + gi(it) + '<div class="gr"><h3 class="rar' + it.rar + '">' + G.itemName(it) + (it.lock ? ' ' + inl('lock') : '') + '</h3><p>' + G.RAR[it.rar] + ' · ' + G.SLOT[G.GEAR[it.type].kind] + ' · ' + itemLine(it) + ' · <span class="gold">' + G.fmt(G.itemPrice(it)) + ' moedas</span></p></div></div>' + (UI.insHtml ? UI.insHtml(it, { card: 1 }) : '') +
        '<div class="row whb" style="margin-top:8px"><button class="btn sm" data-a="item:' + it.id + '">' + ic('up') + 'Aprimorar</button><button class="btn sm" data-a="gift:' + it.id + '">' + ic('gift') + 'Dar</button><button class="btn sm' + (it.lock ? ' on' : '') + '" data-a="lock:' + it.id + '" title="Reservar">' + ic(it.lock ? 'lock' : 'unlock') + '</button><span class="gr"></span><button class="btn sm" data-a="dis:' + it.id + '"' + (it.lock ? ' disabled' : '') + ' title="' + Object.keys(y).map((k) => y[k] + ' ' + G.RES[k].name).join(', ') + '">' + ic('hammer') + 'Desmontar</button><button class="btn sm" data-a="melt:' + it.id + '"' + (it.lock ? ' disabled' : '') + '>' + ic('coin') + G.fmt(Math.round(G.itemPrice(it) * (G.bOk('mercado') ? 0.4 : 0.25))) + '</button></div></div>';
    }
    return h;
  };
  const resTile = (id, capFn, extra) => '<div class="res"><i class="px ri-' + id + '"></i><div class="gr"><b>' + v.T(() => G.fmt(G.S.res[id] || 0) + (capFn ? ' / ' + G.fmt(capFn()) : '')) + '</b><small>' + G.RES[id].name + (extra || '') + '</small></div></div>';
  const armazem = {
    title: 'Armazém', tabs: [['equip', 'Equipamento'], ['atelie', 'Ateliê'], ['consumo', 'Consumíveis'], ['materiais', 'Materiais'], ['especiais', 'Especiais']],
    render(tab) {
      const S = G.S, rates = G.prodRates(), rt = (id) => (rates[id] ? ' · +' + rates[id].toFixed(1).replace('.', ',') + '/h' : '');
      if (tab === 'equip') return whEquip();
      if (tab === 'atelie') return tabAtelie();
      if (tab === 'consumo') {
        let h = '<div class="sec">Para os heróis</div><div class="grid2">' + resTile('refeicao', () => G.resCap('refeicao'), rt('refeicao')) + resTile('pocao', () => G.resCap('pocao'), rt('pocao')) + '</div>';
        h += '<div class="sec">Para as montarias</div><div class="grid2">' + resTile('racao', () => G.resCap('racao'), rt('racao')) + '</div><p class="mut" style="font-size:11.5px;margin:6px 2px">' + SP_INFO.racao + '</p>';
        h += '<div class="sec">Para o treino</div><div class="grid2">' + resTile('tomo') + '</div><p class="mut" style="font-size:11.5px;margin:6px 2px">' + SP_INFO.tomo + '</p>';
        return h;
      }
      if (tab === 'materiais') {
        let h = '<div class="sec">Matéria-prima</div><div class="grid2">'; for (const id of ['madeira', 'pedra', 'minerio', 'trigo', 'ervas']) h += resTile(id, () => G.resCap(id), rt(id)); h += '</div>';
        const mats = Object.keys(S.res).filter((k) => G.RES[k] && G.BASE_RES.indexOf(k) < 0 && !G.RES[k].sp && !G.RES[k].emb && k !== 'essencia' && S.res[k] >= 1);
        h += '<div class="sec">Espólio dos heróis</div>';
        h += mats.length ? '<div class="bagg">' + mats.map((k) => '<span class="bi" title="' + G.RES[k].name + '"><i class="px ri-' + k + '"></i><b>' + v.T(() => G.fmt(G.S.res[k] || 0)) + '</b><small>' + G.RES[k].name.split(' ')[0] + '</small></span>').join('') + '</div>' : '<div class="empty">Nenhum espólio ainda. Os heróis entregam na Guilda o que caçam.</div>';
        return h + '<p class="mut" style="font-size:11.5px;text-align:center;margin-top:10px">Venda o excedente em Reino › Mercado.</p>';
      }
      if (tab === 'especiais') {
        let h = '<div class="grid2"><div class="res"><span style="font-size:20px;color:#ff9ac8">' + ic('seal') + '</span><div class="gr"><b>' + v.T(() => G.S.selos) + '</b><small>Selos de Renome</small></div></div><div class="res"><span style="font-size:20px;color:#c8a0ff">' + ic('core') + '</span><div class="gr"><b>' + v.T(() => G.S.nucleos) + '</b><small>Núcleos</small></div></div></div>';
        for (const id of ['alma', 'po_estelar', 'po_reforja', 'essencia'].concat(G.RES.pergaminho ? ['pergaminho'] : [])) h += '<div class="card" style="margin-top:8px"><div class="row"><i class="px ri-' + id + '" style="width:30px;height:30px"></i><div class="gr"><h3>' + G.RES[id].name + ' <span class="lvl">' + v.T(() => G.fmt(G.S.res[id] || 0)) + '</span></h3><p>' + (SP_INFO[id] || G.RES[id].info || '') + '</p></div></div></div>';
        const embs = Object.keys(G.RES).filter((k) => G.RES[k].emb);
        h += '<div class="sec">Emblemas dos chefes</div><div class="bagg">' + embs.map((k) => '<span class="bi' + ((S.res[k] || 0) >= 1 ? '' : ' none') + '" title="' + G.RES[k].name + '"><i class="px ri-' + k + '"></i><b>' + v.T(() => G.fmt(G.S.res[k] || 0)) + '</b><small>' + G.RES[k].name.replace('Emblema ', '') + '</small></span>').join('') + '</div><p class="mut" style="font-size:11.5px;margin:8px 2px">Emblemas pagam promoções de rank, mudanças de classe e melhorias de construções.</p>';
        return h;
      }
      return '';
    },
  };

  /* ---------- ações dos sistemas novos ---------- */
  const hid = (id) => G.S.heroes.find((x) => x.id === +id);
  const mid = (id) => G.S.stable.list.find((m) => m.id === +id);
  Object.assign(UI.ACT, {
    htab: (a) => { if (UI.sheet && UI.sheet.sub) { UI.sheet.sub.ht = a[0]; draw(true); } },
    hsort: (a) => { G.S.opts.hsort = a[0]; draw(false); },
    orderall: (a) => { G.orderAll(a[0]); UI.toast(a[0] === 'auto' ? 'Cada herói escolhe onde caçar.' : 'Todos os heróis vão caçar em ' + G.ZONE[a[0]].name + '.', 'info', 'target'); draw(false); },
    hheal: (a) => { const h = hid(a[0]); if (h && !G.healNow(h)) UI.toast('Faltam moedas.', 'bad'); },
    hhealall: () => { const n = G.healAll(); if (n) UI.toast(n + ' herói(s) curado(s).', 'good', 'heart'); else UI.toast('Faltam moedas.', 'bad'); },
    recall: (a) => { const h = hid(a[0]); if (h && G.recall(h)) UI.toast(h.name + ' está voltando para a cidade.', 'info', 'castle'); },
    slotinfo: (a) => { const h = hid(a[1]); if (!h) return; const t = G.slotType(h, a[0]), g = G.GEAR[t]; UI.toast(G.gearUnlocked(t) ? g.name + ': forje na Ferraria — ' + h.name + ' compra se tiver moedas.' : g.name + ': requer Ferraria nível ' + g.req + '.', 'info', 'anvil'); },
    job: (a) => { const h = hid(a[0]); if (h && G.JOBS[a[1]]) jobModal(h, a[1]); },
    jobok: (a) => { const h = hid(a[0]); UI.closeModal(); if (h && G.changeJob(h, a[1])) { UI.banner('Mudança de classe', G.JOBS[a[1]].name, h.name + ' aprendeu ' + G.JOBS[a[1]].skill.name); draw(false); } else UI.toast('Faltam recursos para a mudança de classe.', 'bad'); },
    jobreset: (a) => { const h = hid(a[0]); if (h) UI.confirm('Trocar de vocação?', h.name + ' volta à classe-base e pode escolher outro caminho. Os níveis das habilidades ficam guardados. Custa ' + G.jobResetCost() + ' Selos; refazer as mudanças de classe custa de novo.', 'Trocar', () => { if (!G.jobReset(h)) UI.toast('Faltam Selos de Renome.', 'bad'); draw(false); }); },
    skup: (a) => { const h = hid(a[0]); if (!h) return; if (G.skillUp(h, +a[1])) UI.toast(G.heroSkills(h)[+a[1]].name + ' subiu para o nível ' + G.skillLvl(h, +a[1]) + '.', 'good', 'up'); else UI.toast((G.canSkillUp(h, +a[1]).why || 'Não é possível agora') + '.', 'bad'); draw(false); },
    wake: (a) => { const h = hid(a[0]); if (h && G.wake(h)) { UI.banner('Despertar ' + h.wake + ' / 4', h.name, G.WAKES[h.wake - 1].name); draw(false); } },
    artstep: (a) => { artStep = +a[0]; draw(false); },
    art: (a) => { const h = hid(a[0]); if (h && G.artAdd(h, a[1], artStep)) draw(false); },
    artauto: (a) => { const h = hid(a[0]); if (!h) return; const n = G.artAuto(h); if (n) UI.toast(n + ' ponto(s) distribuído(s) nas Artes da classe.', 'good', 'book'); draw(false); },
    artbuy: (a) => { const h = hid(a[0]); if (h && !G.artBuy(h)) UI.toast(G.bOk('treino') ? 'Faltam moedas.' : 'Requer o Campo de Treino.', 'bad'); },
    artreset: (a) => { const h = hid(a[0]); if (h) UI.confirm('Redistribuir as Artes?', 'Todos os pontos gastos voltam para ' + h.name + ' distribuir de novo. Custa ' + G.artResetCost() + ' Selo de Renome.', 'Redistribuir', () => { if (!G.artReset(h)) UI.toast('Faltam Selos de Renome.', 'bad'); draw(false); }); },
    tame: (a) => { const mt = G.tame(a[0]); if (!mt) return UI.toast(G.canTame(a[0]).why + '.', 'bad'); UI.banner('Nova montaria', G.MOUNTS[a[0]].name, 'Escolha um cavaleiro no Estábulo'); draw(false); },
    mfeed: (a) => { const mt = mid(a[0]); if (mt && !G.mountFeed(mt, +a[1])) UI.toast('Sem ração no Estábulo.', 'bad'); else draw(false); },
    mride: (a) => { const mt = mid(a[0]); if (mt) riderModal(mt); },
    mrider: (a) => { const mt = mid(a[0]), h = +a[1] ? hid(a[1]) : null; if (UI.modalOpen) UI.closeModal(); if (!mt) return; G.mountAssign(mt, h); if (h) UI.toast(h.name + ' agora monta ' + G.MOUNTS[mt.k].name + '.', 'good', 'shoe'); draw(false); },
    mfree: (a) => { const mt = mid(a[0]); if (mt) UI.confirm('Soltar ' + G.MOUNTS[mt.k].name + '?', 'A montaria volta para a natureza e a baia fica livre. Não há como desfazer.', 'Soltar', () => { G.mountRelease(mt); draw(false); }); },
    decor: (a) => { if (!G.buyDecor(a[0])) UI.toast((G.canDecor(a[0]).why || 'Não é possível agora') + '.', 'bad'); else draw(false); },
    masc: (a) => { if (!G.mascateBuy(+a[0])) UI.toast('Não foi possível comprar.', 'bad'); else { UI.toast('Negócio fechado com o Mascate.', 'good', 'bag'); draw(false); } },
    whslot: (a) => { whSlot = a[0]; draw(false); },
    lock: (a) => { const it = G.S.inv.find((i) => i.id === +a[0]); if (it) { G.toggleLock(it); UI.toast(it.lock ? 'Peça reservada: os heróis não compram.' : 'Peça liberada para venda.', 'info', it.lock ? 'lock' : 'unlock'); } },
    dis: (a) => { const it = G.S.inv.find((i) => i.id === +a[0]); if (!it) return; const y = G.dismantle(it); if (y) UI.toast('Desmontado: ' + Object.keys(y).map((k) => '+' + y[k] + ' ' + G.RES[k].name).join(', '), 'good', 'hammer'); },
    dall: (a) => { const r = +a[0], n = G.S.inv.filter((it) => !it.lock && it.rar === r).length; if (!n) return; UI.confirm('Desmontar ' + n + ' peça(s)?', 'Todas as peças de raridade ' + G.RAR[r] + ' que não estão reservadas viram material (metade da receita, Pó de Reforja' + (r ? ' e Pó Estelar' : '') + '). Não há como desfazer.', 'Desmontar tudo', () => { const o = G.dismantleAll(r); if (o.n) UI.toast(o.n + ' peça(s) desmontada(s): ' + Object.keys(o.tot).map((k) => '+' + o.tot[k] + ' ' + G.RES[k].name.split(' ').slice(0, G.RES[k].sp ? 3 : 1).join(' ')).join(', '), 'good', 'hammer'); }); },
  });
  /* guia das novidades: aparece uma vez, depois da apresentação */
  UI.NEWS = UI.NEWS || {};
  UI.NEWS.v20 = { t: 'Vocações e ficha do herói', n: 'Aurora · Vocações', lead: 'A ficha de cada herói ganhou cinco abas. Toque em um herói e explore.', rows: [['spark', 'Vocações', 'No Rank C e no Rank A o herói muda de classe: dois ramos, quatro destinos, uma 2ª e uma 3ª habilidade.'], ['book', 'Artes Secretas', '15 artes de 0 a 100. Cada nível, promoção e chefe rende pontos.'], ['star', 'Despertar', 'Quatro estágios com Cristais de Alma e Pó Estelar.'], ['shoe', 'Montarias', 'O Estábulo (Cidadela 3) doma seis espécies e faz ração.'], ['anvil', '8 peças de equipamento', 'Elmo, botas, manoplas, cinturão e anel abrem com a Ferraria.'], ['chest', 'Armazém e Decoração', 'Reserve, desmonte em lote e enfeite a praça por bônus e Encanto.']] };
  UI.vocGuide = () => UI.whatsNew && UI.whatsNew(['v20']);

  /* ================= FORJA ================= */
  let forgeTier = 0;
  const forja = {
    title: 'Forja', tabs: [['forjar', 'Forjar'], ['arsenal', 'Armazém']],
    render(tab) {
      const S = G.S;
      if (!G.bLvl('ferraria')) return '<div class="empty">Construa a Ferraria para transformar o espólio dos heróis em armas e armaduras.<br><br><button class="btn pri" data-a="open:reino:obras">Ver construções</button></div>';
      if (tab === 'arsenal') return whEquip();
      const mt = G.forgeMaxTier(); if (!forgeTier || forgeTier > mt) forgeTier = mt;
      const want = UI.wanted();
      let h = '';
      if (want.length) { h += '<div class="card hl"><h3>' + ic('people') + ' Encomendas dos heróis</h3>'; for (const w of want.slice(0, 5)) h += '<div class="row" style="margin-top:8px"><i class="gi px gi-' + w.type + '" style="box-shadow:inset 0 -3px 0 ' + G.tierColor(w.tier) + '"></i><div class="gr"><b style="font-size:12.5px">' + G.GEAR[w.type].name + ' ' + G.tierName(w.tier) + '</b><br><span class="mut" style="font-size:11.5px">' + w.who.join(', ') + (w.pay ? '' : ' · ainda juntando moedas') + '</span></div><button class="btn sm pri" data-a="craft:' + w.type + ':' + w.tier + ':0" ' + v.Dis(() => !G.canCraft(w.type, w.tier, false).ok) + '>Forjar</button></div>'; h += '</div>'; }
      h += '<div class="chips" style="margin:4px 0 8px">'; for (let t = 1; t <= mt + 1; t++) h += '<button data-a="ftier:' + t + '" class="' + (t === forgeTier ? 'on' : '') + '"' + (t > mt ? ' disabled' : '') + ' style="' + (t <= mt ? 'box-shadow:inset 0 -3px 0 ' + G.tierColor(t) : '') + '">' + (t > mt ? ic('lock').replace('class="i"', 'class="i" style="display:inline;vertical-align:-2px"') + ' ' : '') + G.tierName(t).replace('de ', '').replace('da ', '').replace('das ', '') + '</button>'; h += '</div>';
      const w = G.rarWeights(false), tot = w.reduce((a, b) => a + b, 0);
      h += '<p class="mut" style="font-size:11.5px;margin:0 2px 8px">Chances: ' + w.map((x, i) => (x / tot >= 0.001 ? '<span class="rar' + i + '">' + G.RAR[i] + ' ' + (100 * x / tot).toFixed(x / tot < 0.02 ? 1 : 0).replace('.', ',') + '%</span>' : '')).filter(Boolean).join(' · ') + '. Obra-prima garante Raro ou melhor.</p>' + (UI.forjaNote ? UI.forjaNote() : '');
      for (const type of G.GEAR_IDS) {
        if (!G.gearUnlocked(type)) { h += '<div class="card lock"><div class="row"><i class="gi px gi-' + type + '"></i><div class="gr"><h3>' + G.GEAR[type].name + ' ' + ic('lock') + '</h3><p>Requer Ferraria nível ' + G.GEAR[type].req + '. Todos os heróis usam.</p></div></div></div>'; continue; }
        const g = G.GEAR[type], r = G.recipe(type, forgeTier), base = { type, tier: forgeTier, rar: 0, plus: 0 }, mc = G.craftCost(type, forgeTier, true);
        const users = g.kind !== 'arma' && g.kind !== 'armadura' ? 'Todos' : G.CLASS_IDS.filter((c) => G.CLASSES[c].w === type || G.CLASSES[c].a === type).map((c) => G.CLASSES[c].name).join(', ');
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
    title: 'Missões', tabs: [['jornada', 'Jornada'], ['caminhos', 'Caminhos'], ['contratos', 'Contratos'], ['zonas', 'Zonas'], ['fenda', 'Fenda'], ['incursoes', 'Incursões']],
    badge: { caminhos: () => G.pathsPending(), jornada: () => (G.questCur().done ? 1 : 0), contratos: () => G.S.daily.list.filter((c) => !c.claimed && c.p >= c.n).length + (!G.S.daily.claimed && G.S.daily.list.length && G.S.daily.list.every((c) => c.claimed) ? 1 : 0) },
    render(tab) {
      const S = G.S;
      if (tab === 'caminhos') return tabCaminhos();
      if (tab === 'incursoes') return tabIncursoes();
      if (tab === 'jornada') {
        const q = G.questCur(); const rw = [];
        for (const k in q.r) rw.push(k === 'gold' ? ic('coin') + G.fmt(q.r.gold) : k === 'selos' ? ic('seal') + q.r.selos : k === 'nucleos' ? ic('core') + q.r.nucleos : '<i class="px ri-' + k + '" style="width:16px;height:16px"></i>' + q.r[k]);
        let h = '<div class="card hl"><p class="cz gold" style="font-size:11px;letter-spacing:.2em">' + (q.tag ? q.tag : q.decree ? 'DECRETO REAL ' + (S.quest.decreeN + 1) : 'CAPÍTULO ' + q.idx + ' DE ' + G.QUESTS.length) + '</p><h3 style="font-size:15.5px;margin-top:4px">' + esc(q.t) + '</h3><p>' + esc(q.h) + '</p>' + (UI.preCard ? UI.preCard() : '') + '<div style="margin-top:8px">' + bar(() => { const c = G.questCur(); return Math.round(100 * c.cur / c.n); }, 'big') + '</div><div class="row" style="margin-top:8px"><div class="gr"><div class="costs" style="margin:0">' + rw.map((x) => '<span class="cost">' + x + '</span>').join('') + '</div></div><button class="btn pri" data-a="questclaim" ' + v.Dis(() => !G.questCur().done) + '>' + ic('chest') + 'Resgatar</button></div></div>';
        if (!q.decree) { const nx = G.QUESTS.slice(S.quest.step + (q.tag ? 0 : 1), S.quest.step + (q.tag ? 2 : 3)); if (nx.length) h += '<div class="sec">A seguir</div>' + nx.map((d) => '<div class="card lock"><div class="row">' + ic('lock') + '<div class="gr"><b style="font-size:12.5px">' + esc(d.t) + '</b></div></div></div>').join(''); }
        h += '<div class="sec">Crônica de Aurora</div>';
        for (const l of S.log.slice(-14).reverse()) h += '<div class="logl ' + l.k + '"><small>Dia ' + l.d + ' · ' + G.clockStr(l.c) + '</small>' + esc(l.m) + '</div>';
        return h;
      }
      if (tab === 'contratos') {
        const d = S.daily; let h = (UI.calCard ? UI.calCard() : '') + '<div class="card hl"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:22px;color:var(--gold2)">' + ic('chest') + '</span><div class="gr"><h3>Baú do dia <small>sequência: ' + d.streak + ' dia' + (d.streak === 1 ? '' : 's') + '</small></h3><p>Cumpra os três contratos para abrir. Rende Selos e Núcleos; a cada 5 dias seguidos, bônus.</p></div><button class="btn pri" data-a="chest" ' + v.Dis(() => G.S.daily.claimed || !G.S.daily.list.length || !G.S.daily.list.every((c) => c.claimed)) + '>' + (d.claimed ? 'Aberto' : 'Abrir') + '</button></div></div>';
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
          '<button class="tog" data-a="opt:noVibe"><span>Vibração e tremor de tela<small>Vibra o aparelho (quando ele pode) e sacode a tela nos grandes momentos: peça Lendária, chefe derrotado, vitória na Arena, marco de poder.</small></span><i class="sw' + (o.noVibe ? '' : ' on') + '"></i></button>' +
          '<div class="sec">Jornada salva</div><p class="mut" style="font-size:12px;margin-bottom:8px">O jogo salva sozinho neste aparelho a cada 20 segundos. Exporte o código para guardar ou levar para outro aparelho.</p><div class="grid2"><button class="btn" data-a="export">' + ic('save') + 'Exportar</button><button class="btn" data-a="import">' + ic('save') + 'Importar</button></div><button class="btn wide" style="margin-top:8px" data-a="tutorial">' + ic('info') + 'Rever a apresentação</button><button class="btn wide" style="margin-top:8px;color:#ff9a9a" data-a="reset">' + ic('trash') + 'Apagar e recomeçar</button>' +
          '<p class="mut" style="text-align:center;font-size:11px;margin-top:14px">Aurora — Crônicas da Fenda · v' + G.VERSION + ' "Reino Sem Pausa"<br>Arraste para mover · pinça ou roda do mouse para zoom · toque em tudo</p>';
      }
      return '';
    },
  };
  const SHEETS = { reino, herois, forja, armazem, missoes, mais };
  UI.SHEETS = SHEETS;                // v25: a Arena acrescenta uma aba em Missões (65-ui-arena)
  UI.vw = () => v;                   // v26: as abas de 66-ui-lendas usam os vínculos ao vivo do painel aberto

  /* ---------- abrir / fechar / redesenhar ---------- */
  UI.tabsFor = (name, tabs) => tabs; UI.tabAttr = () => '';       // v26: 6E filtra as abas e põe o selo "Novo!"
  UI.open = (name, tab, sub) => {
    const sh = SHEETS[name]; if (!sh) return;
    if (UI.sheet && UI.sheet.name === name && !tab && !sub && !UI.sheet.sub) return UI.close();
    const prev = UI.sheet && UI.sheet.name === name ? UI.sheet : null;
    const tl = UI.tabsFor(name, sh.tabs);               // v26: só as abas dos sistemas já liberados (6E)
    UI.sheet = { name, tab: tab || (prev && prev.tab) || (tl[0] ? tl[0][0] : ''), sub: sub || null };
    if (tl.length && !tl.some((t) => t[0] === UI.sheet.tab)) UI.sheet.tab = tl[0][0];
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
    const tl = UI.tabsFor(s.name, sh.tabs);
    tb.style.display = tl.length > 1 && !st ? '' : 'none';
    tb.innerHTML = tl.map(([id, l, x]) => (x && x.lock ? '<button class="lk" data-a="syslock:' + x.lock + '">' + ic('lock') + l + '</button>' : '<button data-a="tab:' + id + '" class="' + (id === s.tab ? 'on' : '') + '"' + UI.tabAttr(s.name, id, id === s.tab) + '>' + l + (sh.badge && sh.badge[id] ? tabsV.Badge(sh.badge[id]) : '') + '</button>')).join('');
    { const on = tb.querySelector('button.on'); if (on && on.offsetLeft + on.offsetWidth > tb.clientWidth + tb.scrollLeft) tb.scrollLeft = on.offsetLeft + on.offsetWidth - tb.clientWidth + 12; }
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
    rebirth: (a) => { const h = hero(a[0]); if (h) UI.confirm('Renascer ' + h.name + '?', 'Volta ao nível 1 e ao Rank E, com +30% permanentes em todos os atributos. Equipamento, vocação, Artes e Despertar ficam.', 'Renascer', () => { if (G.rebirth(h)) UI.banner('Sob as Duas Luas', h.name + ' renasceu', 'Estrela ' + h.stars); draw(false); }); },
    dismiss: (a) => { const h = hero(a[0]); if (h) UI.confirm('Dispensar ' + h.name + '?', 'O herói deixa Aurora para sempre. O equipamento dele volta para o Armazém e a montaria, para o Estábulo.', 'Dispensar', () => { G.dismiss(h); UI.sheet.sub = null; draw(true); }); },
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
  /* ================= v21: guarda-roupa, dificuldade, enfeites móveis e Caminhos ================= */
  const COS_ICON = { traje: 'shirt', asas: 'wing', pet: 'paw', reliquia: 'crown' };
  const cosSlot = (x, slot) => {
    const id = x.cos && x.cos[slot];
    return '<button class="ds sp' + (id ? '' : ' vz') + '" data-a="cos:' + x.id + ':' + slot + '">' + (id ? '<i class="gi px" style="background-image:url(' + A.cosURL(id, x) + ')"></i>' : '<i class="gi">' + ic(COS_ICON[slot]) + '</i>') + '<small>' + G.COS_SLOT_NAME[slot] + '</small></button>';
  };
  const dollV21 = (x, look) => '<div class="dollw"><div class="dside">' + cosSlot(x, 'traje') + petSlot(x) + '</div><div class="doll">' + dollSlot(x, 'acessorio') + dollSlot(x, 'elmo') + dollSlot(x, 'armadura') + dollSlot(x, 'arma') + '<i class="px dfig" style="background-image:url(' + A.fullBody(look) + ')"></i>' + dollSlot(x, 'luvas') + dollSlot(x, 'anel') + dollSlot(x, 'cinto') + dollSlot(x, 'botas') + '</div><div class="dside">' + cosSlot(x, 'asas') + cosSlot(x, 'reliquia') + '</div></div>';
  const cosCost = (c) => UI.cost(c.gold || 0, c.res || {}, (c.selos ? '<span class="cost' + (G.S.selos < c.selos ? ' lack' : '') + '">' + ic('seal') + c.selos + '</span>' : '') + (c.nucleos ? '<span class="cost' + (G.S.nucleos < c.nucleos ? ' lack' : '') + '">' + ic('core') + c.nucleos + '</span>' : ''));
  const cosCard = (id, x) => {
    const d = G.COS[id], slot = d.slot, cur = x && x.cos && x.cos[slot], own = G.cosOwned(id), free = G.cosFree(id), mine = cur === id, can = G.cosCan(id), locked = d.cost && G.S.realm.lvl < d.req, hk = x ? x.id : 0;
    return '<div class="card' + (mine ? ' hl' : locked || (!d.cost && !own) ? ' lock' : '') + '" style="text-align:left"><div class="row"><i class="thumb px" style="background-image:url(' + A.cosURL(id, x) + ');background-size:' + (slot === 'traje' ? '46px 53px' : 'contain') + '"></i><div class="gr"><h3 class="rar' + d.rar + '">' + d.name + '</h3><p><b class="gold">' + bonusText(d.p) + '</b></p><p>' + d.desc + '</p><p>' + (own ? 'No reino: ' + own + ' · livre' + (free === 1 ? '' : 's') + ': ' + free : d.cost ? 'Ainda não comprado' : 'Ainda não conquistada') + '</p></div></div>' +
      (locked ? '<p class="bad" style="margin-top:6px">' + can.why + '.</p>' : '<div class="row" style="margin-top:4px"><div class="gr">' + (d.cost ? cosCost(d.cost) : '<p style="margin:0">' + can.why + '.</p>') + '</div>' + (mine ? '<span class="pill gold">' + ic('check') + 'vestindo</span>' : x && free > 0 ? '<button class="btn sm pri" data-a="cosw:' + hk + ':' + slot + ':' + id + '">Vestir</button>' : '') + (d.cost ? '<button class="btn sm' + (free > 0 || mine ? '' : ' vio') + '" data-a="cosb:' + hk + ':' + slot + ':' + id + '"' + (can.ok ? '' : ' disabled') + '>Comprar</button>' : '') + '</div>') + '</div>';
  };
  const tabAtelie = () => {
    let h = '<div class="card hl"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:22px;color:#c9a4ff">' + ic('shirt') + '</span><div class="gr"><h3>Ateliê de Aurora</h3><p>Trajes e asas mudam o visual do herói e dão um bônus. Cada cópia veste um herói por vez: para vestir, toque nos espaços roxos da ficha. Os mascotes vivem no Viveiro, mais abaixo.</p></div></div></div>';
    for (const slot of G.COS_SLOTS) { if (slot === 'reliquia') h += viveiroSec(); h += '<div class="sec">' + ({ traje: 'Trajes', asas: 'Asas', pet: 'Mascotes', reliquia: 'Relíquias dos chefes' })[slot] + '</div>'; for (const id of G.COS_IDS) if (G.COS[id].slot === slot) h += cosCard(id, null); }
    return h;
  };
  const cosModal = (x, slot) => {
    const cur = x.cos && x.cos[slot];
    let h = '<div class="eyebrow">' + (slot === 'reliquia' ? 'Relíquias do reino' : 'Ateliê de Aurora') + '</div><h2>' + G.COS_SLOT_NAME[slot] + ' de ' + esc(x.name) + '</h2><p class="lead" style="font-size:12.5px">' + (slot === 'reliquia' ? 'Relíquias não se compram: a 3ª vitória sobre cada chefe de zona garante a dele, e a Fenda entrega uma a cada 10 andares.' : 'Cada peça comprada veste um herói por vez. Compre mais cópias para vestir outros.') + '</p>';
    if (cur) h += '<button class="btn wide" style="margin-bottom:10px" data-a="cosw:' + x.id + ':' + slot + ':0">' + ic('close') + 'Tirar ' + G.COS[cur].name + '</button>';
    for (const id of G.COS_IDS) if (G.COS[id].slot === slot) h += cosCard(id, x);
    UI.modal(h + '<div class="acts"><button class="btn" data-a="mclose">Fechar</button></div>', { pause: false });
  };
  UI.diffModal = () => {
    const S = G.S;
    let h = '<div class="eyebrow">Dificuldade do reino</div><h2>' + G.diffCur().name + '</h2><p class="lead" style="font-size:12.5px">Vale para todas as zonas e para a Maré. A Fenda Infinita tem a própria escada. Trocar não custa nada; os monstros soltos reaparecem na força nova.</p>';
    G.DIFFS.forEach((d, i) => { const lock = S.realm.lvl < d.realm; h += '<button class="opt" data-a="diffset:' + i + '"' + (lock ? ' disabled' : '') + ' style="' + (S.diff === i ? 'border-color:' + d.c + ';box-shadow:inset 0 0 0 1px ' + d.c : '') + '"><b style="color:' + d.c + '">' + inl('skull') + ' ' + d.name + (S.diff === i ? ' · atual' : '') + '</b><span>' + (lock ? 'Abre no Nível de Reino ' + d.realm + '. ' : '') + d.desc + '</span></button>'; });
    UI.modal(h + '<div class="acts"><button class="btn" data-a="mclose">Fechar</button></div>');
  };
  /* mover enfeites: o painel fecha e os toques no mapa escolhem o ladrilho */
  UI.placing = null;
  const placeBar = () => {
    const p = UI.placing, d = G.DEC[p.id], n = d.spots.length, el = $('#inspect');
    el.innerHTML = '<i class="ip px" style="background-image:url(' + decImg(d) + ');background-size:contain"></i><span class="it"><b>Mover: ' + d.name + '</b><span>' + (n > 1 ? 'Peça ' + (p.i + 1) + ' de ' + n + ' · ' : '') + 'toque em um ladrilho livre</span></span>' + (n > 1 ? '<button class="btn sm" data-a="decskip">Pular</button>' : '') + '<button class="btn sm pri" data-a="decdone">Pronto</button>';
    el.classList.add('on'); $('#quest').style.display = 'none';
    const s = G.decorSpots(d)[p.i]; R.mark = { x: s[0], y: s[1] }; if (p.i === 0) R.focus(s[0], s[1] + 1.5);
  };
  const placeEnd = (reopen) => { UI.placing = null; R.mark = null; UI.inspect(null); if (reopen) UI.open('reino', 'decor'); };
  UI.placeTap = (sx, sy) => {
    const p = UI.placing, w = R.screenToWorld(sx, sy), r = G.decorCanPlace(p.id, p.i, w[0], w[1]);
    if (!r.ok) return UI.toast(r.why + '.', 'bad');
    G.decorPlace(p.id, p.i, w[0], w[1]); G.sfx('build'); p.i++;
    if (p.i >= G.DEC[p.id].spots.length) { UI.toast('Enfeite no lugar novo.', 'good', 'flower'); placeEnd(true); } else placeBar();
  };
  const open0 = UI.open; UI.open = (n, t, s) => { if (UI.placing) { UI.placing = null; R.mark = null; UI.inspect(null); } return open0(n, t, s); };
  const rwChips = (r) => Object.keys(r).map((k) => '<span class="cost">' + (k === 'pet' ? petImg(r.pet, 20) + ' ' + G.PETS[r.pet].name : k === 'gold' ? ic('coin') + G.fmt(r.gold) : k === 'selos' ? ic('seal') + r.selos : k === 'nucleos' ? ic('core') + r.nucleos : '<i class="px ri-' + k + '"></i>' + r[k] + ' <span class="mut">' + G.RES[k].name.split(' ')[0] + '</span>') + '</span>').join('');
  const tabCaminhos = () => {
    const open = G.PATHS.filter((d) => !G.pathDone(d)), done = G.PATHS.length - open.length;
    let h = '<div class="card hl"><div class="row"><span class="thumb sm" style="display:grid;place-items:center;font-size:22px;color:var(--gold2)">' + ic('map') + '</span><div class="gr"><h3>Caminhos <small>' + done + ' / ' + G.PATHS.length + ' concluídos</small></h3>' + bar(() => Math.round(100 * done / G.PATHS.length), 'big') + '<p>Objetivos livres, em qualquer ordem, que apresentam os sistemas novos e pagam em Tomos, Cristais de Alma e Selos.</p></div></div></div>';
    open.sort((a, b) => (G.pathCur(b) >= b.n) - (G.pathCur(a) >= a.n));
    for (const d of open) {
      const ok = G.pathCur(d) >= d.n;
      h += '<div class="card' + (ok ? ' hl' : '') + '"><h3>' + esc(d.t) + '</h3><p>' + esc(d.h) + '</p><div style="margin-top:7px">' + bar(() => Math.round(100 * G.pathCur(d) / d.n), 'big g') + '</div><div class="row" style="margin-top:8px"><div class="gr"><div class="costs" style="margin:0">' + rwChips(d.r) + '</div></div><span class="mut" style="font-size:11.5px;font-weight:800">' + v.T(() => G.fmt(G.pathCur(d)) + ' / ' + G.fmt(d.n)) + '</span><button class="btn sm pri" data-a="pathclaim:' + d.id + '" ' + v.Dis(() => G.pathCur(d) < d.n) + '>' + ic('chest') + 'Receber</button></div></div>';
    }
    if (done) h += '<div class="sec">Concluídos</div>' + G.PATHS.filter(G.pathDone).map((d) => '<div class="card lock"><div class="row">' + ic('check') + '<div class="gr"><b style="font-size:12.5px">' + esc(d.t) + '</b></div></div></div>').join('');
    return h;
  };
  const SK_ICON = { hit: 'sword', multi: 'sword', aoe: 'bolt', stun: 'star', slow: 'wave', dot: 'potion', vuln: 'target', buff: 'flag', heal: 'heart', shield: 'shield', cleanse: 'heart', taunt: 'horn' };
  const CLS_ICON = { esp: 'sword', cav: 'shield', arq: 'target', mag: 'bolt', pal: 'heart', lad: 'skull' };
  const BUFF_ICON = { atk: 'flag', def: 'shield', eva: 'run', thorns: 'shield', regen: 'heart', aspd: 'bolt' };
  const skIcon = (sk, cls) => {
    if (!sk.ops) return CLS_ICON[cls] || 'sword';
    const o = sk.ops[0];
    if (o.o === 'hit') return o.exec ? 'skull' : o.crit ? 'eye' : o.pierce ? 'target' : o.gold ? 'coin' : (o.n || 1) > 1 ? 'bolt' : sk.ops[1] ? SK_ICON[sk.ops[1].o] || 'sword' : 'sword';
    if (o.o === 'aoe') return sk.ops[1] ? SK_ICON[sk.ops[1].o] || 'sun' : 'sun';
    if (o.o === 'buff') return BUFF_ICON[o.k] || 'flag';
    return SK_ICON[o.o] || 'spark';
  };
  Object.assign(UI.ACT, {
    cos: (a) => { const h = hid(a[0]); if (h) cosModal(h, a[1]); },
    cosw: (a) => { const h = hid(a[0]); if (!h) return; if (G.cosWear(h, a[1], a[2] === '0' ? null : a[2])) { cosModal(h, a[1]); draw(false); } else UI.toast('Sem cópia livre desta peça.', 'bad'); },
    cosb: (a) => { const h = +a[0] ? hid(a[0]) : null; if (!G.cosBuy(a[2])) return UI.toast(G.cosCan(a[2]).why + '.', 'bad'); if (h && !h.cos[a[1]]) G.cosWear(h, a[1], a[2]); UI.toast(G.COS[a[2]].name + ' chegou do Ateliê.', 'good', 'gift'); if (h) cosModal(h, a[1]); draw(false); },
    diff: () => UI.diffModal(),
    diffset: (a) => { if (G.setDiff(+a[0])) UI.banner('Dificuldade do reino', G.diffCur().name, G.diffCur().desc); UI.closeModal(); },
    decmove: (a) => { if (!G.decorLvl(a[0]) || !G.decorMovable(a[0])) return; UI.close(); R.follow = 0; UI.inspect(null); UI.placing = { id: a[0], i: 0 }; placeBar(); },
    decskip: () => { const p = UI.placing; if (!p) return; p.i++; if (p.i >= G.DEC[p.id].spots.length) placeEnd(true); else placeBar(); },
    decdone: () => { if (UI.placing) placeEnd(true); },
    decreset: (a) => { G.decorResetPos(a[0]); UI.toast('Enfeite de volta ao lugar original.', 'info', 'flower'); draw(false); },
    pathclaim: (a) => { const t = G.pathClaim(a[0]); if (t) { UI.toast('Caminho concluído: ' + t, 'good', 'chest'); draw(false); } },
    artautotog: (a) => { const h = hid(a[0]); if (!h) return; h.autoArt = h.autoArt ? 0 : 1; if (h.autoArt) G.artAuto(h); draw(false); },
  });
  UI.NEWS.v21 = { t: 'Legado: trajes, relíquias e dificuldade', n: 'Aurora · Legado', rows: [['shirt', 'Trajes e asas', 'Os espaços roxos ao lado do herói abrem o Ateliê. Cada peça muda o visual e dá um bônus.'], ['crown', 'Relíquias', 'Cada chefe de zona guarda uma. A 3ª vitória garante.'], ['skull', 'Dificuldade', 'A caveira no alto da tela troca entre Fácil, Normal, Difícil e Pesadelo.'], ['flower', 'Enfeites móveis', 'Reino › Decoração › Mover: toque no ladrilho onde quer cada peça.'], ['map', 'Caminhos', 'Missões › Caminhos: objetivos livres com recompensas.']] };
  UI.legGuide = () => UI.whatsNew && UI.whatsNew(['v21']);

  /* ================= v22: mascotes, Viveiro, espólio no chão e Incursões ================= */
  const petImg = (k, w) => '<i class="px pimg" style="width:' + w + 'px;height:' + Math.round(w * 12 / 14) + 'px;background-image:url(' + A.petURL(k) + ')"></i>';
  const pctTxt = (v) => (Math.round(v * 1000) / 10).toString().replace('.', ',') + '%';
  const petThumb = (p, w) => '<span class="pthumb" style="border-color:' + G.RAR_COLOR[p.rar] + '">' + petImg(p.k, w || 42) + '</span>';
  const rarTxt = (r) => '<i class="rtag rar' + r + '">' + G.RAR[r] + '</i>';
  const roleLine = (p) => {
    const d = G.PETS[p.k], ro = G.PET_ROLE[d.role];
    const t = d.role === 'carga' ? 'leva ' + G.petLoadCap(p) + ' itens, 50% a mais que outros da mesma raridade'
      : d.role === 'faro' ? 'busca o espólio a até ' + String(G.PET_R_FARO).replace('.', ',') + ' passos do dono e corre 35% mais'
        : d.role === 'fraqueza' ? 'a cada ' + G.WEAK_CD + ' s, o alvo do dono bate e defende ' + pctTxt(G.weakF(p)) + ' menos por ' + G.WEAK_DUR + ' s (chefes resistem à metade)'
          : 'cura ' + pctTxt(G.vigHeal(p)) + ' da vida do dono a cada ' + G.VIG_CD + ' s em combate';
    return '<span class="prole">' + ic(ro.icon) + ro.name + '</span> ' + t + '.';
  };
  /* espaço roxo "Mascote" na ficha */
  const petSlot = (x) => {
    const p = G.petOf(x);
    return '<button class="ds sp' + (p ? '' : ' vz') + '" data-a="petpick:' + x.id + '">' + (p ? '<i class="gi px" style="background-image:url(' + A.petURL(p.k) + ');background-size:34px 29px;border-color:' + G.RAR_COLOR[p.rar] + '!important"></i>' : '<i class="gi">' + ic('paw') + '</i>') + '<small>Mascote</small></button>';
  };
  const petCard = (p, x, viv) => {
    const d = G.PETS[p.k], cap = G.petLoadCap(p), owner = p.hero ? hid(p.hero) : null, mine = !!x && p.hero === x.id;
    let btn = '';
    if (x) btn = mine ? '<button class="btn sm" data-a="petset:' + x.id + ':0">' + ic('close') + 'Dispensar</button>' : '<button class="btn sm pri" data-a="petset:' + x.id + ':' + p.id + '">' + ic('paw') + 'Acompanhar</button>';
    else if (viv) btn = owner ? '<span class="pill">' + ic('people') + esc(owner.name) + '</span>' : '<button class="btn sm" data-a="petfree:' + p.id + '">Soltar</button>';
    return '<div class="card pcard' + (mine ? ' hl' : '') + '"><div class="row" style="align-items:flex-start">' + petThumb(p) + '<div class="gr"><h3>' + d.name + ' ' + rarTxt(p.rar) + '</h3><p><b class="gold">' + bonusText(G.petBonus(p)) + '</b></p><p>' + roleLine(p) + '</p><p>Carga ' + p.bagN + ' / ' + cap + (viv ? (owner ? ' · acompanha ' + esc(owner.name) : ' · livre no Viveiro') : '') + '</p></div></div>' +
      (btn ? '<div class="row pact"><span class="gr mut pdesc">' + esc(d.desc) + '</span>' + btn + '</div>' : '') + '</div>';
  };
  const petModal = (x) => {
    const S = G.S, cur = G.petOf(x), free = G.petFree().sort((a, b) => b.rar - a.rar || G.PET_IDS.indexOf(a.k) - G.PET_IDS.indexOf(b.k));
    let h = '<div class="eyebrow">Viveiro de Aurora · ' + S.pets.length + ' / ' + G.petCap() + '</div><h2>Mascote de ' + esc(x.name) + '</h2><p class="lead" style="font-size:12.5px">O mascote segue o herói, recolhe o espólio que cai no chão e entrega tudo na Guilda junto com ele. Raridade maior carrega mais e fortalece o bônus e o papel.</p>';
    if (cur) h += '<div class="sec">Acompanhando</div>' + petCard(cur, x);
    h += '<div class="sec">Livres no Viveiro</div>' + (free.length ? free.map((p) => petCard(p, x)).join('') : '<div class="card"><p style="margin:0">' + (S.pets.length ? 'Todos os mascotes já acompanham alguém.' : 'Nenhum mascote ainda.') + ' Ovos vêm das Incursões (Missões › Incursões) e, às vezes, do Mascate; o primeiro chega por um Caminho.</p></div>');
    UI.modal(h + '<div class="acts"><button class="btn" data-a="petviv">' + ic('chest') + 'Viveiro</button><button class="btn" data-a="mclose">Fechar</button></div>', { pause: false });
  };
  /* aba Bolsa: a carga do mascote */
  const petBagSec = (x) => {
    const p = G.petOf(x);
    if (!p) return '<div class="sec">Mascote</div><div class="card"><div class="row"><span class="pthumb">' + ic('paw') + '</span><p class="gr" style="margin:0">Sem mascote. Toque no espaço roxo «Mascote» da ficha para escolher um. Ele recolhe o espólio que cai no chão.</p></div></div>';
    const ks = Object.keys(p.bag).filter((k) => p.bag[k] > 0), cap = G.petLoadCap(p);
    return '<div class="sec">Carga do mascote <span class="mut" style="letter-spacing:0;text-transform:none;font-family:inherit">' + v.T(() => p.bagN + ' / ' + cap) + '</span></div><div class="card"><div class="row">' + petThumb(p, 36) + '<div class="gr"><b style="font-size:13px">' + G.PETS[p.k].name + '</b> ' + rarTxt(p.rar) + '<div style="margin-top:6px">' + bar(() => Math.round(100 * p.bagN / cap), 'big o') + '</div></div></div>' +
      (ks.length ? '<div class="bagg" style="margin-top:8px">' + ks.map((k) => '<span class="bi" title="' + G.RES[k].name + '"><i class="px ri-' + k + '"></i><b>' + p.bag[k] + '</b><small>' + G.RES[k].name.split(' ')[0] + '</small></span>').join('') + '</div>' : '<p style="margin-top:8px">Nada recolhido nesta saída.</p>') +
      '<p style="margin-top:6px">A carga vai para o Armazém junto com a bolsa, na Guilda. Se o dono cair, o mascote não perde nada.</p></div>';
  };
  /* Armazém › Ateliê › Viveiro */
  const viveiroSec = () => {
    const S = G.S, L = S.pets.slice().sort((a, b) => b.rar - a.rar || (a.hero ? 0 : 1) - (b.hero ? 0 : 1) || G.PET_IDS.indexOf(a.k) - G.PET_IDS.indexOf(b.k));
    let h = '<div class="sec" id="viveiro">Viveiro <span class="mut" style="letter-spacing:0;text-transform:none;font-family:inherit">' + S.pets.length + ' / ' + G.petCap() + '</span></div>';
    h += '<div class="card hl"><p style="margin-top:0">Os mascotes acompanham os heróis e recolhem o espólio que cai no chão. Cabem ' + G.petCap() + ' (8 + 2 por nível do Estábulo). Três mascotes livres da mesma raridade se fundem em um da raridade seguinte.</p><div class="chips" style="margin-top:8px">' +
      [0, 1, 2, 3, 4].map((r) => { const n = G.petFree().filter((p) => p.rar === r).length; return '<button data-a="petfuse:' + r + '"' + (n >= 3 ? '' : ' disabled') + '>Fundir <b class="rar' + r + '">' + G.RAR[r] + '</b> · ' + n + '</button>'; }).join('') + '</div></div>';
    return h + (L.length ? L.map((p) => petCard(p, null, true)).join('') : '<div class="card"><p style="margin:0">Nenhum mascote ainda. O primeiro vem pelo Caminho «Adote o primeiro mascote»; os raros, das Incursões.</p></div>');
  };
  let fuseSel = [];
  const fuseModal = (r) => {
    const fr = G.petFree().filter((p) => p.rar === r);
    fuseSel = fuseSel.filter((id) => fr.some((p) => p.id === id)); if (!fuseSel.length) fuseSel = fr.slice(0, 3).map((p) => p.id);
    let h = '<div class="eyebrow">Viveiro · fusão</div><h2>Fundir três ' + G.RAR[r].toLowerCase() + 's</h2><p class="lead" style="font-size:12.5px">Escolha três. Eles viram um mascote ' + G.RAR[r + 1] + ' de uma das três espécies, por sorteio. A carga vai de ' + G.PET_CAP[r] + ' para ' + G.PET_CAP[r + 1] + ' e os bônus ficam ' + Math.round((G.PET_POW[r + 1] / G.PET_POW[r] - 1) * 100) + '% mais fortes.</p>';
    for (const p of fr) { const on = fuseSel.indexOf(p.id) >= 0; h += '<button class="slot" data-a="fsel:' + r + ':' + p.id + '" style="' + (on ? 'box-shadow:inset 0 0 0 2px var(--gold)' : '') + '">' + petImg(p.k, 36) + '<span class="gr"><b>' + G.PETS[p.k].name + '</b><br><span class="mut" style="font-size:11.5px">' + G.PET_ROLE[G.PETS[p.k].role].name + ' · ' + bonusText(G.petBonus(p)) + '</span></span><i class="sw' + (on ? ' on' : '') + '"></i></button>'; }
    UI.modal(h + '<div class="acts"><button class="btn" data-a="mclose">Cancelar</button><button class="btn pri" data-a="fgo:' + r + '"' + (fuseSel.length === 3 ? '' : ' disabled') + '>Fundir</button></div>', { pause: false });
  };

  /* ================= Missões › Incursões ================= */
  let incZ = null, incParty = null; const incG = {};
  const PHASE = { walk: 'Marcha até o covil', w1: '1ª onda de elites', w2: '2ª onda de elites', alfa: 'O Alfa' };
  const arrowR = () => ic('back').replace('class="i"', 'class="i" style="transform:scaleX(-1)"');
  const incRunCard = (r) => {
    const z = G.ZONE[r.z], alfa = () => G.mons.find((m) => m.id === (G.S.inc.run && G.S.inc.run.alfa) && !m.dead);
    let h = '<div class="card"><h3>' + ic('skull') + ' Incursão em andamento <small>' + z.name + ' · Grau ' + G.roman(r.g) + '</small></h3>';
    h += '<div class="kv"><span>Fase</span><b>' + v.T(() => (G.S.inc.run ? PHASE[G.S.inc.run.phase] : 'encerrada')) + '</b></div>';
    h += '<div class="kv"><span>Tempo de combate</span><b>' + v.T(() => { const q = G.S.inc.run; if (!q) return '—'; return q.phase === 'walk' ? 'começa no covil' : 'restam ' + Math.max(0, Math.ceil(q.limit - q.ft)) + ' s'; }) + '</b></div>';
    if (r.phase === 'alfa') h += '<div class="kv"><span>Alfa · ' + G.MON[z.boss].name + ' Nv ' + r.lvl + '</span><b>' + v.T(() => { const m = alfa(); return m ? Math.round(100 * Math.max(0, m.hp) / m.hpMax) + '%' : '—'; }) + '</b></div>' + bar(() => { const m = alfa(); return m ? Math.round(100 * Math.max(0, m.hp) / m.hpMax) : 0; }, 'big p');
    h += '<div class="sec">Grupo</div>';
    for (const id of r.ids) { const x = hid(id); if (!x) continue; h += '<div class="row" style="margin-bottom:6px"><i class="px" style="width:30px;height:30px;background-image:url(' + UI.portrait(x) + ');background-size:30px 30px"></i><div class="gr"><b style="font-size:12.5px">' + esc(x.name) + '</b> <span class="mut" style="font-size:11px">' + v.T(() => (x.state === 'inc' ? x.potions + ' poções' : G.stateLabel(x))) + '</span>' + bar(() => Math.round(100 * Math.max(0, x.hp) / G.heroStats(x).hp), 'g') + '</div></div>'; }
    return h + '<button class="btn wide" style="margin-top:8px" data-a="goto:' + z.lair[0] + ':' + z.lair[1] + '">' + ic('eye') + 'Ver o covil</button></div>';
  };
  const tabIncursoes = () => {
    const S = G.S;
    if (!G.incOpen()) return '<div class="empty">' + ic('lock').replace('class="i"', 'class="i" style="font-size:28px;margin:0 auto 8px"') + 'As Incursões se abrem quando Aurora alcançar o Nível de Reino 6. São a fonte dos mascotes raros.</div>';
    const zs = G.ZONES.filter(G.zoneUnlocked);
    if (!incZ || !zs.some((z) => z.id === incZ)) incZ = zs[0].id;
    let h = '<div class="card hl"><h3 class="cz">Incursões</h3><p>Até cinco heróis invadem o covil de uma zona: duas ondas de elites e depois o Alfa, uma versão mais forte do chefe. Lá dentro ninguém recua. A vitória choca um ovo de mascote — quanto mais alto o Grau, mais rara a cria.</p><div class="grid3" style="margin-top:8px"><div class="stat"><small>Vitórias</small><b>' + (S.inc.wins || 0) + '</b></div><div class="stat"><small>Viveiro</small><b>' + S.pets.length + ' / ' + G.petCap() + '</b></div><div class="stat"><small>Hoje</small><b>' + v.T(() => (G.incFree() ? 'grátis' : G.incCost() + ' Núcleos')) + '</b></div></div></div>';
    if (S.inc.run) return h + incRunCard(S.inc.run);
    const L = S.inc.last;
    if (L && L.day >= S.day - 1 && G.ZONE[L.z]) h += '<div class="card' + (L.win ? ' lk' : '') + '"><div class="row">' + (L.win && L.k ? petImg(L.k, 34) : ic(L.win ? 'check' : 'skull')) + '<p class="gr" style="margin:0">Última: ' + G.ZONE[L.z].name + ', Grau ' + G.roman(L.g) + ' — ' + (L.win ? 'vitória' + (L.k ? (L.pet ? '; chocou ' : '; Viveiro cheio, o ovo de ') + G.PETS[L.k].name + ' ' + G.RAR[L.rar] + (L.pet ? '' : ' virou Pó Estelar') : '') : 'derrota (' + (L.why === 'time' ? 'o tempo acabou' : 'todos caíram') + ')') + '.</p></div></div>';
    h += '<div class="sec">Covil</div><div class="chips">' + zs.map((z) => { const b = G.incBest(z.id); return '<button data-a="incz:' + z.id + '" class="' + (z.id === incZ ? 'on' : '') + '">' + z.name.split(' ')[0] + (b ? ' · ' + G.roman(b) : '') + '</button>'; }).join('') + '</div>';
    const max = G.incMax(incZ), g = G.clamp(incG[incZ] || max, 1, max), z = G.ZONE[incZ], lvl = G.incLvl(incZ, g), zm = G.ZMATS[z.n]; incG[incZ] = g;
    h += '<div class="card" style="margin-top:8px"><div class="row"><button class="btn sm" data-a="incg:-1"' + (g <= 1 ? ' disabled' : '') + '>' + ic('back') + '</button><div class="gr" style="text-align:center"><b class="cz" style="font-size:17px">Grau ' + G.roman(g) + '</b><br><span class="mut" style="font-size:11.5px">' + z.name + '</span></div><button class="btn sm" data-a="incg:1"' + (g >= max ? ' disabled' : '') + '>' + arrowR() + '</button></div>';
    h += '<div class="kv"><span>Alfa</span><b>' + G.MON[z.boss].name + ' · Nv ' + lvl + '</b></div><div class="kv"><span>Ondas de elites</span><b>Nv ' + (lvl - 4) + ' e ' + (lvl - 3) + '</b></div><div class="kv"><span>Tempo de combate</span><b>' + Math.round(G.INC_LIMIT / 60) + ' min</b></div>';
    h += '<div class="kv"><span>Prêmio</span><b>ovo · ' + (4 + 2 * g) + ' ' + G.RES[zm.a].name.split(' ')[0] + ' · ' + (4 + 2 * g) + ' ' + G.RES[zm.b].name.split(' ')[0] + ' · ' + (1 + Math.floor(g / 3)) + ' ' + G.RES[zm.r].name.split(' ')[0] + ' · ' + (1 + Math.floor(g / 3)) + ' Tomo(s)</b></div>';
    if (g === max && g > G.incBest(incZ) && g < G.INC_GRADES) h += '<p class="gold" style="margin-top:6px">Vencer abre o Grau ' + G.roman(g + 1) + ' neste covil.</p>';
    h += '<p style="margin-top:8px">Chance de raridade do ovo</p><div class="odds">' + G.INC_ODDS[g - 1].map((w, i) => '<span class="od' + (w ? '' : ' z') + '" style="border-color:' + G.RAR_COLOR[i] + '"><b style="color:' + G.RAR_COLOR[i] + '">' + String(w).replace('.', ',') + '%</b><small>' + G.RAR[i] + '</small></span>').join('') + '</div>';
    h += '<p style="margin-top:8px">Nativos do covil, mais prováveis no ovo:</p><div class="row" style="margin-top:4px;gap:14px">' + (G.ZPETS[incZ] || []).map((k) => '<span class="row" style="gap:6px">' + petImg(k, 28) + '<span style="font-size:12px"><b>' + G.PETS[k].name + '</b><br><span class="mut">' + G.PET_ROLE[G.PETS[k].role].name + '</span></span></span>').join('') + '</div></div>';
    const avail = S.heroes.filter((x) => x.state !== 'fallen' && x.state !== 'recover' && x.state !== 'rift');
    if (!incParty) incParty = avail.slice().sort((a2, b2) => G.heroStats(b2).eff - G.heroStats(a2).eff).slice(0, 5).map((x) => x.id);
    incParty = incParty.filter((id) => avail.some((x) => x.id === id));
    h += '<div class="sec">Grupo (até 5)</div>';
    for (const x of avail) { const on = incParty.indexOf(x.id) >= 0, e = G.heroStats(x).eff, pt = G.petOf(x); h += '<button class="slot" data-a="incp:' + x.id + '" style="' + (on ? 'box-shadow:inset 0 0 0 2px var(--gold)' : '') + '"><i class="px" style="width:36px;height:36px;background-image:url(' + UI.portrait(x) + ');background-size:36px 36px"></i><span class="gr"><b>' + rank(x.rank) + ' ' + esc(x.name) + '</b><br><span class="' + (e >= lvl + 2 ? 'good' : e >= lvl - 2 ? 'gold' : 'bad') + '" style="font-size:11.5px">aguenta até Nv ' + e + ' · ' + x.potions + ' poções</span></span>' + (pt ? petImg(pt.k, 24) : '') + '<i class="sw' + (on ? ' on' : '') + '"></i></button>'; }
    const c = G.incCanStart(incZ, g);
    h += '<button class="btn pri wide" style="margin-top:6px" data-a="incgo" ' + v.Dis(() => !G.incCanStart(incZ, g).ok || !incParty || !incParty.length) + '>' + ic('skull') + (G.incFree() ? 'Enviar Incursão' : 'Tentar de novo hoje · ' + G.incCost() + ' Núcleos') + '</button><p class="mut" style="text-align:center;font-size:11.5px;margin-top:6px">' + (c.ok ? 'Uma tentativa grátis por dia. Não sai junto com a Maré nem com a Fenda.' : c.why + '.') + '</p>';
    return h;
  };
  UI.dropTap = (d) => { G.dropTake(d); };
  Object.assign(UI.ACT, {
    petpick: (a) => { const h = hid(a[0]); if (h) petModal(h); },
    petset: (a) => {
      const h = hid(a[0]); if (!h) return; const p = +a[1] ? G.petById(+a[1]) : G.petOf(h); if (!p) return;
      if (+a[1]) { G.petAssign(p, h); UI.toast(G.PETS[p.k].name + ' agora acompanha ' + h.name + '.', 'good', 'paw'); } else { G.petAssign(p, null); UI.toast(G.PETS[p.k].name + ' voltou ao Viveiro.', 'info', 'paw'); }
      petModal(h); draw(false);
    },
    petviv: () => { UI.closeModal(); UI.open('armazem', 'atelie'); setTimeout(() => { const el = document.getElementById('viveiro'); if (el) el.scrollIntoView({ block: 'start' }); }, 30); },
    petfree: (a) => { const p = G.petById(+a[0]); if (p) UI.confirm('Soltar ' + G.PETS[p.k].name + '?', 'O mascote volta para a natureza e deixa ' + 2 * (p.rar + 1) + ' Pó Estelar no Viveiro. Não há como desfazer.', 'Soltar', () => { G.petRelease(p); draw(false); }); },
    petfuse: (a) => { fuseSel = []; fuseModal(+a[0]); },
    fsel: (a) => { const id = +a[1], i = fuseSel.indexOf(id); if (i >= 0) fuseSel.splice(i, 1); else if (fuseSel.length < 3) fuseSel.push(id); else UI.toast('A fusão usa exatamente três.', 'bad'); fuseModal(+a[0]); },
    fgo: () => { const n = G.petFuse(fuseSel.map((id) => G.petById(id))); UI.closeModal(); fuseSel = []; if (n) { UI.banner('Fusão no Viveiro', G.PETS[n.k].name, G.RAR[n.rar]); draw(false); } else UI.toast('Escolha três mascotes livres da mesma raridade.', 'bad'); },
    incz: (a) => { incZ = a[0]; draw(false); },
    incg: (a) => { const max = G.incMax(incZ); incG[incZ] = G.clamp((incG[incZ] || max) + +a[0], 1, max); draw(false); },
    incp: (a) => { const id = +a[0], i = incParty.indexOf(id); if (i >= 0) incParty.splice(i, 1); else if (incParty.length < 5) incParty.push(id); else UI.toast('A Incursão leva no máximo 5 heróis.', 'bad'); draw(false); },
    incgo: () => { const g = incG[incZ] || G.incMax(incZ); if (G.incStart(incZ, g, incParty || [])) { incParty = null; UI.toast('Incursão a caminho do covil!', 'boss', 'skull'); draw(true); } else UI.toast((G.incCanStart(incZ, g).why || 'Escolha o grupo') + '.', 'bad'); },
  });
  G.on('inc', (d) => {
    if (!d || !d.end || !d.last) return; const L = d.last;
    if (L.win) UI.banner('Incursão vencida · Grau ' + G.roman(L.g), L.k ? G.PETS[L.k].name + ' ' + G.RAR[L.rar] : 'Vitória', L.pet ? 'Um ovo chocou no Viveiro' : 'Viveiro cheio: o ovo virou Pó Estelar e Cristal de Alma');
  });
  UI.NEWS.v22 = { t: 'Companheiros: mascotes e Incursões', n: 'Aurora v22 · Companheiros', rows: [['bag', 'Espólio no chão', 'Metade do que os monstros soltam vai para a bolsa do herói; a outra metade cai no chão e some depois de um tempo. Toque no brilho para mandar direto ao Armazém.'],
        ['paw', 'Mascotes de verdade', 'Cada herói leva um mascote que recolhe o que caiu e entrega na Guilda junto com ele. Toque no espaço roxo «Mascote» da ficha.'],
        ['star', 'Raridade e papéis', 'Raridade maior carrega mais. Alguns lançam Fraqueza nos monstros, outros dão vida e curam o dono.'],
        ['skull', 'Incursões', 'Missões › Incursões, a partir do Nível de Reino 6: elites, um Alfa e um ovo de mascote no fim. Graus altos chocam crias raras.'],
        ['chest', 'Viveiro e fusão', 'Armazém › Ateliê › Viveiro: três mascotes da mesma raridade viram um da raridade seguinte.']] };
  UI.compGuide = () => UI.whatsNew && UI.whatsNew(['v22']);
  document.addEventListener('input', (e) => { const k = e.target.getAttribute && e.target.getAttribute('data-opt'); if (k && G.S) { G.S.opts[k] = +e.target.value / 100; G.emit('opts'); } });
})();

;
