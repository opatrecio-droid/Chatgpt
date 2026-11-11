  /* ================= v23: painel do prédio, cardápios, encomendas e vozes da cidade ================= */
  const nf = (x, d) => (+x).toFixed(d == null ? 1 : d).replace('.', ',');
  const bpBar = (V, fn, cls) => '<div class="bar ' + (cls || '') + '"><i ' + V.W(fn) + '></i></div>';
  const PROD = { fazenda: 1, lenharia: 1, pedreira: 1, padaria: 1 };
  const USES = {
    guilda: 'Os heróis entregam aqui o espólio da bolsa e a carga do mascote.',
    hospedaria: 'Os heróis dormem aqui quando o vigor baixa.', taverna: 'Os heróis comem aqui quando a saciedade ou o ânimo baixam.',
    enfermaria: 'Os heróis feridos se tratam aqui; os caídos se recuperam aqui.', ferraria: 'Os heróis compram aqui o que você forja.',
    alquimista: 'Os heróis compram poções aqui antes de sair.', mercado: 'Os heróis compram acessórios aqui.', treino: 'Os heróis pagam para treinar aqui, sem risco.',
  };
  /* herói «médio» para mostrar taxas: nível médio de todos */
  const refLvl = () => { const hs = G.S.heroes; return hs.length ? Math.max(1, Math.round(hs.reduce((s, x) => s + x.lvl, 0) / hs.length)) : 1; };
  const refHero = () => ({ lvl: refLvl(), traits: [] });

  /* ---------- texto de cada degrau do cardápio ---------- */
  const tierFx = (bid, i, l) => {
    const T = G.SVC[bid].tiers[i]; l = Math.max(l, G.SVC_LVL[i]); const a = [];
    if (bid === 'taverna') {
      const d = G.svcEatDur(i, l);
      a.push('Recupera ' + Math.round(22 * T.r * d) + ' de saciedade em ' + nf(d) + ' s · ânimo +' + Math.round(4 * (1 + 0.1 * l) * T.ar * d));
      if (T.fed) a.push('<b class="gold">Bem alimentado ' + Math.round(T.fed.t / 60) + ' min: +' + Math.round(T.fed.atk * 100) + '% ataque' + (T.fed.xp ? ', +' + Math.round(T.fed.xp * 100) + '% experiência' : '') + '</b>');
    } else if (bid === 'hospedaria') {
      const r = 3.2 * (1 + 0.12 * l) * T.r;
      a.push('Recupera 100 de vigor em ' + Math.ceil(100 / r) + ' s · cura ' + nf(2 * T.hp) + '% da vida por segundo');
      if (T.rest) a.push('<b class="gold">Descansado ' + Math.round(T.rest.t / 60) + ' min: cansa ' + Math.round(T.rest.f * 100) + '% menos' + (T.anim ? ' · ânimo +' + T.anim : '') + '</b>');
    } else {
      const r = 7 * (1 + 0.2 * l) * T.r;
      a.push('Cura 100% da vida em ' + Math.ceil(100 / r) + ' s');
      const x = []; if (T.dot) x.push('tira veneno e queimadura'); if (T.wound) x.push('tira o ferimento na hora'); if (T.vig) x.push('+' + T.vig + ' de vigor');
      if (x.length) a.push('<b class="gold">' + x.join(' · ') + '</b>');
    }
    return a;
  };
  const tierFee = (bid, i) => { const D = G.SVC[bid], h = refHero(); return Math.round(G.price(h, D.kind) * D.tiers[i].p); };
  const menuSec = (V, bid) => {
    const S = G.S, D = G.SVC[bid], l = G.bLvl(bid), open = G.svcTiersOpen(bid), mx = G.svcMax(bid), cap = S.svc[bid] | 0, rl = refLvl();
    let h = '<div class="sec">Cardápio <span class="mut" style="letter-spacing:0;text-transform:none;font-family:inherit">' + open + ' / 4 degraus</span></div>';
    h += '<div class="chips" style="margin-bottom:8px"><button data-a="bpsvc:' + bid + ':0" class="' + (cap ? '' : 'on') + '">Sempre o melhor liberado</button></div>';
    D.tiers.forEach((T, i) => {
      const lock = i >= open, on = i <= mx && !lock, top = i === mx;
      h += '<div class="mnu' + (lock ? ' lock' : on ? '' : ' off') + (top ? ' top' : '') + '"><div class="row"><div class="gr"><b>' + (i + 1) + '. ' + T.name + '</b> <span class="lvl">Nv ' + G.SVC_LVL[i] + '</span>' + (top ? ' <span class="pill gold">servindo até aqui</span>' : '') + '</div>' +
        (lock ? '<span class="mut mlk">' + ic('lock') + 'Nv ' + G.SVC_LVL[i] + '</span>' : top && cap ? '' : '<button class="btn sm' + (cap === i + 1 ? ' on' : '') + '" data-a="bpsvc:' + bid + ':' + (i + 1) + '">Servir até aqui</button>') + '</div>' +
        '<p class="mds">' + esc(T.desc) + '</p>' + tierFx(bid, i, l).map((t) => '<p>' + t + '</p>').join('') +
        '<p class="mut">' + (bid === 'taverna' ? 'Gasta ' + T.ref + ' refeiç' + (T.ref > 1 ? 'ões' : 'ão') + ' · ' : '') + 'Taxa ' + G.fmt(tierFee(bid, i)) + ' moedas' + (bid === 'enfermaria' ? ' (herói Nv ' + rl + ' com metade da vida)' : ' (herói Nv ' + rl + ')') + '</p></div>';
    });
    h += '<p class="bpnote">Cada herói pede o melhor degrau que consegue pagar com as moedas dele; quem não tem moedas recebe o primeiro de graça. A taxa vai para o cofre.' + (bid === 'taverna' ? ' Pratos que gastam mais de uma refeição só saem com o estoque no dobro do que gastam.' : '') + '</p>';
    void V; return h;
  };
  /* ---------- Enfermaria: reerguer ---------- */
  const reviveSec = () => {
    const S = G.S, l = G.bOk('enfermaria') ? G.bLvl('enfermaria') : 0, rl = refLvl(), h0 = refHero();
    let h = '<div class="sec">Reerguer caídos</div><div class="card"><p style="margin-top:0">Recuperação natural (herói Nv ' + rl + '): <b>' + Math.round(G.reviveTimeAt(rl, l)) + ' s</b>. Volta com <b>' + Math.round(G.reviveHp() * 100) + '%</b> da vida, ferido por 2:30 (−15% ataque e defesa).</p><p>Reerguer na hora custa conforme a dificuldade do reino:</p><div class="dif4">';
    G.DIFFS.forEach((d, i) => { h += '<div class="stat' + (S.diff === i ? ' dcur' : '') + '" style="' + (S.diff === i ? 'border-color:' + d.c : '') + '"><small style="color:' + d.c + '">' + d.name + '</small><b>' + G.fmt(G.reviveCost(h0, i)) + '</b></div>'; });
    return h + '</div><p class="mut" style="font-size:11px">Valores para um herói Nv ' + rl + ' (×' + G.REVIVE_DIFF.map((x) => nf(x, 2).replace(/,?0+$/, '')).join(' · ×') + ').</p></div>';
  };
  /* ---------- produção ---------- */
  const npcState = (n) => (!n ? 'ainda não chegou' : n.act === 'work' ? 'trabalhando' : n.act === 'lunch' ? 'no almoço' : n.act === 'home' ? 'em casa' : n.act === 'hide' ? 'abrigado' : 'de folga');
  const staffSec = (id) => {
    const cast = G.CAST.filter((c) => c.at === id);
    if (!cast.length) return '';
    return '<div class="sec">Quem trabalha aqui</div><div class="card">' + cast.map((c) => '<div class="kv"><span>' + esc(c.name) + ' · ' + esc(c.job) + '</span><b>' + bpV.T(() => (G.bLvl(id) ? npcState(G.npcs.find((x) => x.name === c.name)) : 'chega com a obra')) + '</b></div>').join('') + '</div>';
  };
  const PROD_RES = { fazenda: [['trigo', 'das 6h às 18h'], ['ervas', 'das 6h às 18h']], lenharia: [['madeira', 'das 6h às 18h']], pedreira: [['pedra', 'das 6h às 18h'], ['minerio', 'das 6h às 18h']], padaria: [['refeicao', 'das 5h às 21h, 2 trigo cada']], alquimista: [['pocao', 'das 5h às 21h, 2 ervas cada']], estabulo: [['racao', 'das 5h às 21h, 2 trigo cada']] };
  const prodSec = (id) => {
    const S = G.S, L = PROD_RES[id]; if (!L) return '';
    let h = '<div class="card">';
    for (const [k, w] of L) h += '<div class="kv"><span><i class="px ri-' + k + '" style="width:16px;height:16px;vertical-align:-3px"></i> ' + G.RES[k].name + ' <small class="mut">(' + w + ')</small></span><b class="good">' + bpV.T(() => '+' + nf(G.prodRates()[k] || 0) + '/h') + '</b></div><div class="kv"><span>Estoque</span><b>' + bpV.T(() => G.fmt(G.S.res[k] || 0) + ' / ' + G.fmt(G.resCap(k))) + '</b></div>';
    h += '<p style="margin-top:6px">A produção cresce com a felicidade dos moradores (' + bpV.T(() => Math.round(G.S.happy || 70) + '%') + ') e com a Bênção do Ofício.' + (S.b[id] && S.b[id].dmg ? ' <b class="bad">Parada até o conserto.</b>' : '') + '</p></div>';
    return h;
  };
  /* ---------- o que o prédio oferece agora ---------- */
  const svcTab = (id) => {
    const S = G.S, d = G.BLD[id], l = G.bLvl(id), rl = refLvl(), h0 = refHero();
    if (!l) return '<div class="card"><p style="margin-top:0"><b class="good">Ao construir:</b> ' + bldEffect(id, 1) + '</p>' + (G.SVC[id] ? '<p>Já abre com o primeiro degrau do cardápio: <b>' + G.SVC[id].tiers[0].name + '</b>.</p>' : '') + '</div>' + (G.SVC[id] ? menuSec(bpV, id) : '');
    let h = '<div class="card"><p style="margin-top:0"><b class="gold">Agora:</b> ' + bldEffect(id, l) + '</p>';
    const kv = (k, fn) => { h += '<div class="kv"><span>' + k + '</span><b>' + bpV.T(fn) + '</b></div>'; };
    const cap = G.bldCap(id);
    if (cap) kv('Lotação', () => G.bldIn(id) + ' / ' + G.bldCap(id) + ' heróis');
    if (id === 'taverna') kv('Refeições no estoque', () => G.fmt(G.S.res.refeicao || 0) + ' / ' + G.resCap('refeicao'));
    if (G.SVC[id]) kv('Servindo', () => (G.svcMax(id) >= 0 ? 'até ' + G.SVC[id].tiers[G.svcMax(id)].name : '—'));
    if (G.SVC[id]) kv(G.SVC[id].unit + 's servidos', () => G.fmt(G.S.stats.svcT[id].reduce((a, b) => a + b, 0)));
    if (id === 'cidadela') { kv('Moradores', () => G.S.pop + ' / ' + G.popCap()); kv('Armazém (matéria-prima)', () => G.fmt(G.resCap('madeira'))); }
    if (id === 'guilda') { kv('Espólio recebido hoje', () => G.fmt(G.S.rep.today.mats || 0)); kv('Promoção até o Rank', () => G.RANKS[Math.min(7, G.bLvl('guilda'))]); }
    if (id === 'ferraria') { kv('Peças à venda no Armazém', () => G.S.inv.filter((i) => i.forSale).length); }
    if (id === 'alquimista') { kv('Poções no estoque', () => G.fmt(G.S.res.pocao || 0) + ' / ' + G.resCap('pocao')); kv('Preço da poção (herói Nv ' + rl + ')', () => G.fmt(G.price(h0, 'potion')) + ' moedas'); }
    if (id === 'mercado') { kv('Dízimo por dia', () => '+' + G.fmt(G.taxEstimate())); kv('Encomendas em aberto', () => G.S.orders.length + ' / ' + G.ordSlots()); }
    if (id === 'treino') kv('Sessão (herói Nv ' + rl + ')', () => G.fmt(G.price(h0, 'train')) + ' moedas');
    if (id === 'estabulo') kv('Montarias', () => G.S.stable.list.length + ' / ' + (1 + G.bLvl('estabulo')) + ' baias');
    if (id === 'santuario') kv('Graça das Luas por queda', () => Math.round(Math.min(0.6, 0.12 + 0.05 * G.bLvl('santuario')) * 100) + '%');
    h += '</div>';
    if (PROD_RES[id] && !PROD[id]) h += prodSec(id);
    if (G.SVC[id]) h += menuSec(bpV, id);
    if (id === 'enfermaria') h += reviveSec();
    if (id === 'mercado') h += ordSec(bpV);
    return h;
  };
  const prodTab = (id) => {
    const l = G.bLvl(id);
    if (!l) return '<div class="card"><p style="margin-top:0"><b class="good">Ao construir:</b> ' + bldEffect(id, 1) + '</p></div>' + staffSec(id);
    return '<div class="card"><p style="margin-top:0"><b class="gold">Agora:</b> ' + bldEffect(id, l) + '</p></div>' + prodSec(id) + staffSec(id);
  };
  /* ---------- quem está lá dentro ---------- */
  const whoSig = (id) => { const w = G.bldWho(id); return ['inside', 'going', 'waiting', 'recover'].map((k) => w[k].map((x) => x.id + (k === 'inside' ? x.act + (x._svcI | 0) : '')).join('.')).join('|'); };
  const heroRow = (x, sub, btn) => '<div class="bpr"><button class="bpk" data-a="bphero:' + x.id + '"><i class="px" style="background-image:url(' + UI.portrait(x) + ')"></i><span class="gr"><b>' + esc(x.name) + ' <small class="mut">Nv ' + x.lvl + '</small></b><span>' + sub + '</span></span></button>' + (btn || '') + '</div>';
  const herTab = (id) => {
    const w = G.bldWho(id), cap = G.bldCap(id);
    let h = '<div class="card"><div class="kv"><span>Lá dentro agora</span><b>' + bpV.T(() => G.bldIn(id) + (G.bldCap(id) ? ' / ' + G.bldCap(id) : '') + ' heróis') + '</b></div>' + (cap ? '<div style="margin:6px 0 2px">' + bpBar(bpV, () => Math.min(100, Math.round(100 * G.bldIn(id) / Math.max(1, G.bldCap(id)))), 'big') + '</div><p>' + (id === 'treino' ? 'O Campo de Treino atende 1 herói por nível; os outros vão caçar e voltam depois.' : 'Lotação de 3 + nível. Cheio, o herói espera na porta (até duas vezes); vida abaixo de 30% ou saciedade zerada passam na frente.') + '</p>' : '<p>Sem limite de lotação.</p>') + '</div>';
    if (w.inside.length) { h += '<div class="sec">Lá dentro</div>'; for (const x of w.inside) h += heroRow(x, bpV.T(() => G.stateLabel(x)) + ' · ' + bpV.T(() => (x.state === 'inside' ? 'faltam ' + Math.ceil(G.svcLeft(x)) + ' s' : 'saiu'))); }
    if (w.recover.length) { h += '<div class="sec">Em recuperação</div>'; for (const x of w.recover) h += heroRow(x, bpV.T(() => (x.state === 'fallen' ? 'Caído em combate' : 'Volta em ' + Math.max(0, Math.ceil((x.reviveAt || 0) - G.S.t)) + ' s')), '<button class="btn sm red" data-a="bprev:' + x.id + '" ' + bpV.Dis(() => G.S.gold < G.reviveCost(x)) + '>' + ic('heart') + bpV.T(() => G.fmt(G.reviveCost(x))) + '</button>'); }
    if (w.waiting.length) { h += '<div class="sec">Esperando vaga</div>'; for (const x of w.waiting) h += heroRow(x, bpV.T(() => 'tenta de novo em ' + Math.max(0, Math.ceil(x.until - G.S.t)) + ' s')); }
    if (w.going.length) { h += '<div class="sec">A caminho</div>'; for (const x of w.going) h += heroRow(x, esc(G.stateLabel(x))); }
    if (!w.inside.length && !w.recover.length && !w.waiting.length && !w.going.length) h += '<div class="card"><p style="margin:0">Ninguém aqui agora. ' + (USES[id] || (PROD[id] ? 'Os heróis não trabalham aqui: a produção é dos moradores (aba Produção).' : 'Os heróis não usam este prédio diretamente.')) + '</p></div>';
    return h;
  };
  /* ---------- faixa do próximo nível ---------- */
  const nextBand = (id) => {
    const S = G.S, d = G.BLD[id], l = G.bLvl(id), bs = S.b[id], n = l + 1;
    if (bs && bs.dmg) return '<div class="bpn bad"><b>Danificada na Maré.</b> Fechada até o conserto (' + G.fmt(G.repairCost(id)) + ' moedas).</div>';
    if (!G.bAvailable(id)) return '<div class="bpn"><b>Ainda trancado.</b> <span class="bad">Necessário: Cidadela Nv ' + d.cid + '</span><p>' + esc(d.desc) + '</p></div>';
    const c = G.bCost(id, n), x = [];
    if (G.SVC[id]) { const k = G.SVC_LVL.indexOf(n); if (k >= 0) x.push('libera <b>' + G.SVC[id].tiers[k].name + '</b>'); }
    if (G.bldCap(id) || G.SVC[id] || id === 'treino') x.push('lotação ' + (l ? (id === 'treino' ? l : 3 + l) + ' → ' : '') + (id === 'treino' ? n : 3 + n));
    if (id === 'enfermaria') { const rl = refLvl(); x.push('recuperação em ' + Math.round(G.reviveTimeAt(rl, n)) + ' s' + (l ? ' (hoje ' + Math.round(G.reviveTimeAt(rl, l)) + ' s)' : '') + ' · voltam com ' + Math.round(G.reviveHp(n) * 100) + '% da vida'); }
    if (id === 'mercado') x.push(1 + Math.floor(n / 3) + ' encomenda(s) em aberto, até ' + 100 * n + ' por pedido');
    /* requisito sempre visível: Nível de Reino para a Cidadela; nível da Cidadela para os outros */
    const rq = id === 'cidadela' ? ['Nível de Reino ' + G.cidReq(n), S.realm.lvl >= G.cidReq(n)] : ['Cidadela Nv ' + Math.max(d.cid || 1, n - 2), G.bLvl('cidadela') >= Math.max(d.cid || 1, n - 2)];
    return '<div class="bpn"><b>' + (l ? 'No nível ' + n + ':' : 'Ao construir:') + '</b> ' + bldEffect(id, n) + (x.length ? ' · ' + x.join(' · ') : '') + '<p class="' + (rq[1] ? 'good' : 'bad') + ' bprq">' + ic(rq[1] ? 'check' : 'lock') + 'Necessário: ' + rq[0] + '</p>' + UI.cost(c.gold, c.cost) + '</div>';
  };
  /* ---------- o painel ---------- */
  let bp = null, bpV = new UI.View(null);
  const bpRender = () => {
    if (!bp) return;
    const id = bp.id, d = G.BLD[id], l = G.bLvl(id), bs = G.S.b[id], prod = !!PROD[id], cap = G.bldCap(id);
    const keep = UI.modalOpen && $('#bp-root') ? $('#modal .mbox').scrollTop : 0;
    bpV = new UI.View(null);
    let h = '<div id="bp-root"><div class="bph"><i class="thumb px" style="background-image:url(' + bldThumb(id) + ')"></i><div class="gr"><h2>' + (l ? 'Nv ' + l : 'A construir') + ' · ' + d.name + '</h2><p class="bpf">' + esc(d.desc) + '</p></div></div>';
    if (bs && bs.dmg) h += '<p class="bad bpdm">' + ic('skull') + ' Danificada na Maré: fechada até o conserto.</p>';
    h += '<div class="tabs bpt"><button data-a="bpt:svc" class="' + (bp.tab === 'svc' ? 'on' : '') + '">' + (prod ? 'Produção' : 'Serviço') + '</button><button data-a="bpt:her" class="' + (bp.tab === 'her' ? 'on' : '') + '">Heróis ' + bpV.T(() => G.bldIn(id) + (G.bldCap(id) ? ' / ' + G.bldCap(id) : '')) + '</button></div>';
    h += '<div class="bpb">' + (bp.tab === 'her' ? herTab(id) : prod ? prodTab(id) : svcTab(id)) + '</div>';
    h += nextBand(id);
    const can = G.bAvailable(id) && !(bs && bs.dmg);
    h += '<div class="acts">' + (bs && bs.dmg ? '<button class="btn red" data-a="bprep:' + id + '" ' + bpV.Dis(() => G.S.gold < G.repairCost(id)) + '>' + ic('hammer') + 'Consertar</button>' : can ? '<button class="btn pri" data-a="bpup:' + id + '" ' + bpV.Dis(() => !G.canUpgrade(id).ok) + '>' + ic(l ? 'up' : 'hammer') + (l ? 'Melhorar' : 'Construir') + '</button>' : '') +
      '<button class="btn" data-a="bpsee:' + id + '">' + ic('eye') + 'Ver no mapa</button><button class="btn" data-a="mclose">Fechar</button></div></div>';
    void cap;
    UI.modal(h, { pause: false, onClose: () => { bp = null; } });
    bpV.root = $('#modal .mbox'); if (keep) bpV.root.scrollTop = keep;
    bp.sig = whoSig(id); bp.lvl = l;
  };
  UI.bldPanel = (id, tab) => { if (!G.BLD[id]) return; bp = { id, tab: tab || 'svc' }; R.follow = 0; bpRender(); };
  const bpLive = () => !!bp && UI.modalOpen && !!$('#bp-root');
  const bpTick = () => {
    if (!bp) return; if (!bpLive()) { bp = null; return; }
    if (bp.lvl !== G.bLvl(bp.id) || (bp.tab === 'her' && whoSig(bp.id) !== bp.sig)) bpRender(); else bpV.refresh();
  };
  const bpRe = () => { if (bpLive()) bpRender(); };
  G.on('bld', bpRe); G.on('svc', bpRe); G.on('orders', bpRe); G.on('diff', bpRe);
  G.on('orders', () => UI.sheetDirty()); G.on('svc', () => UI.sheetDirty());

  /* ================= encomendas da caravana ================= */
  let ordK = null, ordN = 10;
  const ordSec = (V) => {
    const S = G.S;
    if (!G.bLvl('mercado')) return '';
    const items = G.ordItems(); if (!items.length) return '';
    if (items.indexOf(ordK) < 0) ordK = items[0];
    const mx = G.ordMax(ordK); ordN = G.clamp(ordN, Math.min(10, mx), mx);
    let h = '<div class="sec" id="ord-sec">Encomendas da caravana <span class="mut" style="letter-spacing:0;text-transform:none;font-family:inherit">' + V.T(() => G.S.orders.length + ' / ' + G.ordSlots()) + '</span></div>';
    h += '<div class="card hl"><p style="margin-top:0">Peça materiais das zonas já abertas. Você paga agora; a caravana entrega na próxima alvorada, direto no Armazém. Cancelar antes da entrega devolve ' + Math.round(G.ORD_REFUND * 100) + '%. Mercado Nv ' + G.bLvl('mercado') + ': ' + G.ordSlots() + ' encomenda(s) por vez, até ' + G.ordMax('couro') + ' comuns ou ' + G.ordMax('presa') + ' raros por pedido.</p></div>';
    h += '<div class="ordg">' + items.map((k) => '<button class="ordc' + (k === ordK ? ' on' : '') + (G.RES[k].rare ? ' rare' : '') + '" data-a="ordk:' + k + '" title="' + esc(G.RES[k].name) + '"><i class="px ri-' + k + '"></i><b>' + esc(G.RES[k].name) + '</b><small>' + nf(G.ordPrice(k), G.ordPrice(k) % 1 ? 1 : 0) + ' cada · tem ' + V.T(() => G.fmt(G.S.res[k] || 0)) + '</small></button>').join('') + '</div>';
    const c = G.ordCost(ordK, ordN);
    h += '<div class="card"><div class="row"><i class="px ri-' + ordK + '" style="width:28px;height:28px"></i><div class="gr"><h3>' + G.RES[ordK].name + (G.RES[ordK].rare ? ' <small class="epic">raro</small>' : '') + '</h3><p>' + nf(G.ordPrice(ordK), 1) + ' moedas cada (vende a ' + nf(G.sellPrice(ordK), 1) + ') · até ' + mx + ' por pedido</p></div></div>' +
      '<div class="ordq"><button class="btn sm" data-a="ordq:-10"' + (ordN <= Math.min(10, mx) ? ' disabled' : '') + '>−10</button><b>' + ordN + '</b><button class="btn sm" data-a="ordq:10"' + (ordN >= mx ? ' disabled' : '') + '>+10</button><button class="btn sm" data-a="ordq:100"' + (ordN >= mx ? ' disabled' : '') + '>+100</button></div>' +
      '<div class="row" style="margin-top:8px"><div class="gr"><p style="margin:0">Custo: <b class="gold">' + G.fmt(c) + '</b> moedas · chega na alvorada</p></div><button class="btn sm pri" data-a="ordgo" ' + V.Dis(() => !G.ordCan(ordK, ordN).ok) + '>' + ic('coin') + 'Encomendar</button></div>' +
      '<p class="mut ordw">' + V.T(() => { const r = G.ordCan(ordK, ordN); return r.ok ? '' : r.why + '.'; }) + '</p></div>';
    if (S.orders.length) {
      h += '<div class="card">';
      for (const o of S.orders) h += '<div class="row ordl"><i class="px ri-' + o.k + '" style="width:24px;height:24px"></i><div class="gr"><b>' + o.n + ' ' + esc(G.RES[o.k].name) + '</b><br><small class="mut">pago ' + G.fmt(o.gold) + ' · chega na alvorada</small></div><button class="btn sm" data-a="ordx:' + o.id + '">Cancelar · volta ' + G.fmt(G.ordRefund(o)) + '</button></div>';
      h += '</div>';
    }
    return h;
  };
  const ordRedraw = () => { if (bpLive()) bpRender(); if (UI.sheet) UI.redraw(); };

  Object.assign(UI.ACT, {
    bp: (a) => UI.bldPanel(a[0]),
    bpt: (a) => { if (!bp) return; bp.tab = a[0]; bpRender(); const m = $('#modal .mbox'); if (m) m.scrollTop = 0; },
    bpsvc: (a) => { if (G.svcSet(a[0], +a[1])) UI.toast(+a[1] ? 'A ' + G.BLD[a[0]].short + ' serve até ' + G.SVC[a[0]].tiers[+a[1] - 1].name + '.' : 'A ' + G.BLD[a[0]].short + ' serve o melhor degrau liberado.', 'info', 'check'); bpRe(); },
    bpup: (a) => { const was = G.bLvl(a[0]); if (!G.upgrade(a[0])) return UI.toast(G.canUpgrade(a[0]).why || 'Não é possível agora.', 'bad'); UI.toast(was ? G.BLD[a[0]].short + ' chegou ao nível ' + G.bLvl(a[0]) + '.' : G.BLD[a[0]].name + ' foi erguida.', 'good', 'hammer'); bpRe(); },
    bprep: (a) => { if (!G.repair(a[0])) UI.toast('Faltam moedas.', 'bad'); bpRe(); },
    bpsee: (a) => { const p = G.W.plots[a[0]]; UI.closeModal(); if (!p) return; R.follow = 0; R.focus(p.cx, p.cy); if (UI.sheet && window.innerWidth < 860) UI.close(); },
    bphero: (a) => { const x = hid(a[0]); if (!x) return; UI.closeModal(); if (UI.sheet && window.innerWidth < 860) UI.close(); R.follow = x.id; R.focus(x.x, x.y); UI.inspect({ type: 'hero', ref: x }); },
    bprev: (a) => { const x = hid(a[0]); if (x && !G.reviveNow(x)) UI.toast('Faltam moedas.', 'bad'); bpRe(); },
    ordk: (a) => { ordK = a[0]; ordN = G.clamp(ordN, Math.min(10, G.ordMax(ordK)), G.ordMax(ordK)); ordRedraw(); },
    ordq: (a) => { const mx = G.ordMax(ordK); ordN = G.clamp(ordN + +a[0], Math.min(10, mx), mx); ordRedraw(); },
    ordgo: () => { const o = G.ordPlace(ordK, ordN); if (!o) return UI.toast(G.ordCan(ordK, ordN).why + '.', 'bad'); UI.toast('Encomenda feita: ' + o.n + ' ' + G.RES[o.k].name + '. Chega na alvorada.', 'good', 'gift'); ordRedraw(); },
    ordx: (a) => { const o = G.S.orders.find((x) => x.id === +a[0]); if (!o) return; UI.confirm('Cancelar a encomenda?', o.n + ' ' + G.RES[o.k].name + ': voltam ' + G.fmt(G.ordRefund(o)) + ' das ' + G.fmt(o.gold) + ' moedas pagas.', 'Cancelar encomenda', () => { G.ordCancel(o.id); UI.toast('Encomenda cancelada.', 'info', 'coin'); if (UI.sheet) UI.redraw(); }); },
  });

  /* ================= vozes da cidade ================= */
  const VOZ = []; let vozDirty = true, vozNew = false;
  const bk0 = G.bark;
  G.bark = (e, key, p) => {
    const t0 = e.sayT || 0, s0 = e.say; bk0(e, key, p);
    if (e.say && ((e.sayT || 0) > t0 + 0.01 || e.say !== s0) && e.cls && G.S) { VOZ.push({ id: e.id, n: e.name, s: e.say, c: Math.floor(G.S.clock) }); if (VOZ.length > 30) VOZ.shift(); vozDirty = true; vozNew = true; }
  };
  UI.vozes = VOZ;
  const vozOpen = () => { const o = G.S && G.S.opts.vozes; return o == null ? window.innerWidth >= 860 : !!o; };
  const vozDraw = () => {
    const el = $('#vozes'), fab = $('#fab-voz'); if (!el || !G.S) return;
    const on = vozOpen(); el.classList.toggle('on', on); if (fab) { fab.classList.toggle('on', on); if (on) vozNew = false; fab.classList.toggle('new', vozNew && !on); }
    if (!on || !vozDirty) return; vozDirty = false;
    const L = VOZ.slice(-12).reverse();
    $('#vozes .vzl').innerHTML = L.length ? L.map((o) => '<button class="vzi" data-a="vozgo:' + o.id + '"><b>' + esc(o.n) + '</b><span>' + esc(o.s) + '</span><small>' + G.clockStr(o.c) + '</small></button>').join('') : '<p class="mut" style="margin:4px 2px;font-size:11.5px">Quando os heróis falarem, as falas aparecem aqui.</p>';
  };
  const b0 = UI.build;
  UI.build = () => {
    b0();
    $('#fabs-l').insertAdjacentHTML('afterbegin', '<button class="fab glass" id="fab-voz" data-a="vozes" aria-label="Vozes da cidade">' + ic('chat') + '<i class="vdot"></i></button>');
    $('#app').insertAdjacentHTML('beforeend', '<div id="vozes" class="glass"><div class="vzh"><b>' + ic('chat') + ' Vozes da cidade</b><button data-a="vozes" aria-label="Fechar">' + ic('close') + '</button></div><div class="vzl"></div></div>');
  };
  Object.assign(UI.ACT, {
    vozes: () => { G.S.opts.vozes = vozOpen() ? 0 : 1; vozDirty = true; vozDraw(); },
    vozgo: (a) => { const x = hid(a[0]); if (!x) return UI.toast('Esse herói não está mais em Aurora.', 'info'); R.follow = x.id; R.focus(x.x, x.y); UI.inspect({ type: 'hero', ref: x }); },
  });
  G.on('start', () => { VOZ.length = 0; vozDirty = true; vozNew = false; });

  /* ================= atualização e guia ================= */
  const rf0 = UI.refresh;
  UI.refresh = () => { rf0(); if (!G.S || !G.M.running) return; bpTick(); vozDraw(); };
  UI.ofiGuide = () => {
    G.S.tut.seen.v23 = 1;
    UI.modal('<div class="eyebrow">Aurora v' + G.VERSION + ' · Ofícios</div><h2>O que há de novo</h2>' +
      [['castle', 'Painel do prédio', 'Toque numa construção no mapa (ou no botão de informação em Reino › Prédios): o que ela faz, quem está lá dentro e o que o próximo nível traz.'],
        ['meal', 'Cardápios', 'Taverna, Hospedaria e Enfermaria têm quatro degraus, liberados nos níveis 1, 3, 6 e 9. O herói pede o melhor que pode pagar; os melhores deixam «bem alimentado» ou «descansado».'],
        ['people', 'Lotação', 'Cada prédio atende alguns heróis por vez. Cheio, o herói espera um pouco na porta; ferido grave passa na frente.'],
        ['heart', 'Reerguer', 'Reerguer um caído na hora custa conforme a dificuldade do reino. A Enfermaria mostra a tabela.'],
        ['coin', 'Encomendas', 'No Mercado, encomende materiais das zonas abertas: a caravana entrega na alvorada.'],
        ['chat', 'Vozes da cidade', 'O balão no canto esquerdo guarda as últimas falas dos heróis. Toque numa fala para ir até quem falou.']]
        .map(([i, t, d]) => '<div class="row" style="margin-bottom:9px"><span class="thumb sm" style="display:grid;place-items:center;font-size:20px;color:var(--gold2)">' + ic(i) + '</span><div class="gr"><b style="font-size:13px">' + t + '</b><br><span class="mut" style="font-size:12px">' + d + '</span></div></div>').join('') +
      '<div class="acts"><button class="btn pri" data-a="mclose">Entendi</button></div>');
  };
