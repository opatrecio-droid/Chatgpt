/* ===== 37-oficios.js ===== */
/* 37-oficios: v23 — cardápios de serviço (Taverna, Hospedaria, Enfermaria) com quatro degraus,
   lotação dos prédios, efeitos «bem alimentado» e «descansado», reerguer com custo pela dificuldade
   e encomendas de materiais na caravana do Mercado. Sem DOM. */
'use strict';
(function () {
  const Wd = G.W;

  /* ================= cardápios ================= */
  /* cada degrau é liberado por um nível do prédio. p = taxa em relação ao preço-base do serviço;
     r = ritmo (saciedade, vigor ou cura por segundo); s = a refeição termina mais depressa;
     ar = ritmo do ânimo; hp = cura durante o descanso; ref = refeições gastas do estoque. */
  G.SVC_LVL = [1, 3, 6, 9];
  G.SVC = {
    taverna: { act: 'eat', kind: 'meal', unit: 'Prato', tiers: [
      { name: 'Caldo da Casa', p: 1, ref: 1, r: 1, s: 1, ar: 1, desc: 'Pão, caldo quente e conversa de balcão.' },
      { name: 'Ensopado do Caçador', p: 2.2, ref: 1, r: 1.6, s: 1.25, ar: 2, fed: { t: 180, atk: 0.04, xp: 0 }, desc: 'Carne de javali e raízes, como os caçadores gostam.' },
      { name: 'Assado na Brasa', p: 4, ref: 2, r: 2.2, s: 1.5, ar: 3.5, fed: { t: 240, atk: 0.06, xp: 0.05 }, desc: 'Costela lenta na brasa de lenha do vale.' },
      { name: 'Banquete das Duas Luas', p: 7, ref: 3, r: 3, s: 1.8, ar: 5.5, fed: { t: 360, atk: 0.09, xp: 0.1 }, desc: 'Mesa farta, música e um brinde a cada lua.' },
    ] },
    hospedaria: { act: 'rest', kind: 'rest', unit: 'Quarto', tiers: [
      { name: 'Catre do Viajante', p: 1, r: 1, hp: 1, desc: 'Palha limpa e um cobertor grosso.' },
      { name: 'Quarto da Lareira', p: 2.2, r: 1.35, hp: 1.25, rest: { t: 240, f: 0.15 }, desc: 'Fogo baixo a noite inteira.' },
      { name: 'Aposento do Vigia', p: 4, r: 1.7, hp: 1.5, rest: { t: 300, f: 0.25 }, desc: 'Silêncio garantido pela guarda da torre.' },
      { name: 'Suíte das Duas Luas', p: 7, r: 2.1, hp: 2, rest: { t: 360, f: 0.35 }, anim: 10, desc: 'Janela para as luas e banho de ervas.' },
    ] },
    enfermaria: { act: 'heal', kind: 'heal', unit: 'Tratamento', tiers: [
      { name: 'Atadura e Unguento', p: 1, r: 1, desc: 'O básico, bem feito.' },
      { name: 'Compressa de Ervas', p: 2, r: 1.4, dot: 1, desc: 'Ervas da fazenda que puxam o veneno.' },
      { name: 'Sutura de Prata', p: 3.5, r: 1.85, dot: 1, wound: 1, desc: 'Linha de prata que fecha até ferida de chefe.' },
      { name: 'Elixir da Fonte', p: 6, r: 2.4, dot: 1, wound: 1, vig: 30, desc: 'Água da Fonte das Duas Luas, destilada por Olívia.' },
    ] },
  };
  G.SVC_IDS = Object.keys(G.SVC);
  G.svcTiersOpen = (bid, l) => { if (l == null) l = G.bLvl(bid); let n = 0; for (const v of G.SVC_LVL) if (l >= v) n++; return n; };
  /* índice do degrau mais alto que o prédio serve agora (-1 se não serve nada) */
  G.svcMax = (bid) => { const n = G.svcTiersOpen(bid); if (!n) return -1; const c = (G.S.svc && G.S.svc[bid]) | 0; return (c > 0 ? Math.min(c, n) : n) - 1; };
  /* 0 = o melhor liberado; 1..4 = servir até esse degrau */
  G.svcSet = (bid, n) => {
    const S = G.S; if (!G.SVC[bid]) return false; n = n | 0;
    if (n < 0 || n > 4 || (n > 0 && n > G.svcTiersOpen(bid))) return false;
    S.svc[bid] = n; G.emit('svc', bid); return true;
  };
  G.svcEatDur = (i, l) => 5 / (1 + 0.08 * (l == null ? G.bLvl('taverna') : l)) / G.SVC.taverna.tiers[i].s;
  /* taxa de um degrau para este herói (a da Enfermaria depende da vida que falta, como antes) */
  G.svcFee = (h, bid, i, st) => {
    const D = G.SVC[bid], T = D.tiers[i]; let f = G.price(h, D.kind) * T.p;
    if (bid === 'enfermaria') { st = st || G.heroStats(h); f *= 0.4 + 1.2 * (1 - Math.max(0, h.hp) / st.hp); }
    return Math.round(f);
  };
  /* o herói pede o melhor degrau que consegue pagar; sem moedas, o degrau 1 (como sempre foi).
     Pratos que gastam mais de uma refeição só saem com o estoque no dobro do que gastam. */
  G.svcPick = (h, bid, st) => {
    const S = G.S, D = G.SVC[bid], mx = G.svcMax(bid);
    for (let i = mx; i > 0; i--) {
      const T = D.tiers[i];
      if (T.ref > 1 && (S.res.refeicao || 0) < T.ref * 2) continue;
      if (h.lux || G.svcFee(h, bid, i, st) <= h.gold) return i;
    }
    return 0;
  };
  /* a Enfermaria tira o ferimento? (degrau que o herói consegue pagar) */
  G.svcCures = (h) => {
    const mx = G.svcMax('enfermaria'), T = G.SVC.enfermaria.tiers;
    for (let i = mx; i >= 0; i--) if (T[i].wound && G.svcFee(h, 'enfermaria', i) <= h.gold) return true;
    return false;
  };

  /* ================= lotação ================= */
  /* Taverna, Hospedaria e Enfermaria: 3 + nível (a Hospedaria abriga 3 + nível heróis, então ninguém espera
     enquanto os prédios andam juntos). Campo de Treino: 1 por nível, como já era. Os outros não têm limite. */
  G.bldCap = (id) => { const l = G.bLvl(id); if (!l) return 0; if (id === 'treino') return l; return G.SVC[id] ? 3 + l : 0; };
  G.bldIn = (id) => { let n = 0; for (const h of G.S.heroes) if (h.state === 'inside' && h.inside === id) n++; return n; };
  G.WAIT_MAX = 2;        // esperas na porta antes de ser atendido de qualquer jeito
  G.bldWho = (id) => {
    const S = G.S, o = { inside: [], going: [], waiting: [], recover: [] };
    for (const h of S.heroes) {
      if (h.state === 'inside' && h.inside === id) o.inside.push(h);
      else if (h.state === 'goto' && h.dest === id) o.going.push(h);
      else if (h.state === 'idle' && h._waitB === id && S.t < h.until + 0.5) o.waiting.push(h);
      else if ((h.state === 'recover' || h.state === 'fallen') && id === 'enfermaria') o.recover.push(h);
    }
    return o;
  };
  const wait = (h, bid) => {
    const S = G.S;
    h._waitB = bid; h._waitN = (h._waitN || 0) + 1; h.state = 'idle'; h.until = S.t + G.rnd(4, 6);
    const d = Wd.door(bid), p = Wd.nearestWalk(d[0] + G.rnd(-1.6, 1.6), d[1] + G.rnd(0.7, 1.5)); G.go(h, p[0], p[1]);
    S.stats.waits = (S.stats.waits || 0) + 1; G.bark(h, 'full', 0.6);
  };
  /* chegada à Taverna, Hospedaria ou Enfermaria (pay e enter são os do 30-heroes) */
  G.svcArrive = (h, st, pay, enter) => {
    const S = G.S, bid = h.dest, act = h.act, D = G.SVC[bid], own = !!D && D.act === act;
    if (act === 'eat' && !(S.res.refeicao >= 1)) { h.state = 'town'; G.bark(h, 'hungry', 0.6); return; }
    if (h._waitB !== bid) h._waitN = 0;
    const cap = G.bldCap(bid), crit = act === 'eat' ? h.fome <= 0 : h.hp < st.hp * 0.3;
    if (cap && !crit && G.bldIn(bid) >= cap) {
      if ((h._waitN || 0) < G.WAIT_MAX) return wait(h, bid);
      S.stats.svcExtra = (S.stats.svcExtra || 0) + 1;   // terceira tentativa: atendido mesmo lotado
    }
    h._waitB = null; h._waitN = 0;
    const i = own ? G.svcPick(h, bid, st) : 0, T = own ? D.tiers[i] : null;
    if (act === 'eat') {
      G.addRes('refeicao', -Math.min(T.ref, Math.floor(S.res.refeicao))); S.stats.meals++; pay(h, 'meal', T.p);
      if (h.lux) { h.lux = 0; const p = Math.round(h.gold * 0.12); h.gold -= p; G.earn(p, 'servicos'); h.animo = 100; }
      enter(h, 'eat', G.svcEatDur(i));
    } else if (act === 'rest') { pay(h, 'rest', T ? T.p : 1); enter(h, 'rest', 60); }
    else {
      pay(h, 'heal', (0.4 + 1.2 * (1 - h.hp / st.hp)) * (T ? T.p : 1)); enter(h, 'heal', 60);
      if (T && T.dot) h.dot = null;
      if (T && T.wound && h.wound > S.t) { h.wound = 0; G.bark(h, 'cured', 0.5); }
    }
    h._svcB = own ? bid : null; h._svcI = i; h._svcR = T ? T.r : 1; h._svcH = (T && T.hp) || 1; h._svcA = (T && T.ar) || 1;
    if (own) S.stats.svcT[bid][i]++;
  };
  /* fim do serviço: o efeito que o degrau deixa */
  G.svcDone = (h) => {
    const S = G.S, D = G.SVC[h._svcB], T = D && D.tiers[h._svcI | 0];
    if (T) {
      if (T.fed && (!(h.fedT > S.t) || T.fed.atk >= (h.fedA || 0))) { h.fedT = S.t + T.fed.t; h.fedA = T.fed.atk; h.fedX = T.fed.xp; G.bark(h, 'feast', 0.45); }
      if (T.rest && (!(h.restT > S.t) || T.rest.f >= (h.restF || 0))) { h.restT = S.t + T.rest.t; h.restF = T.rest.f; G.bark(h, 'cozy', 0.4); }
      if (T.vig) h.energia = Math.min(100, h.energia + T.vig);
      if (T.anim) h.animo = Math.min(100, h.animo + T.anim);
    }
    h._svcB = null; h._svcR = h._svcH = h._svcA = 1;
  };
  /* quanto falta lá dentro (estimativa para o painel) */
  G.svcLeft = (h) => {
    const S = G.S; let t = Math.max(0, h.until - S.t);
    if (h.act === 'rest') t = Math.min(t, Math.max(0, 100 - h.energia) / (3.2 * (1 + 0.12 * G.bLvl('hospedaria')) * (h._svcR || 1)));
    else if (h.act === 'heal') { const st = G.heroStats(h); t = Math.min(t, Math.max(0, st.hp - h.hp) / (st.hp * 0.07 * (1 + 0.2 * G.bLvl('enfermaria')) * (h._svcR || 1))); }
    return t;
  };
  /* efeitos ativos no herói, em texto curto (ficha e painel) */
  const mmss = (s) => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const pc = (v) => Math.round(v * 100) + '%';
  G.effText = (h) => {
    const S = G.S, a = [];
    if (h.fedT > S.t) a.push('Bem alimentado ' + mmss(h.fedT - S.t) + ' (+' + pc(h.fedA || 0) + ' ataque' + (h.fedX ? ', +' + pc(h.fedX) + ' exp.' : '') + ')');
    if (h.restT > S.t) a.push('Descansado ' + mmss(h.restT - S.t) + ' (cansa ' + pc(h.restF || 0) + ' menos)');
    if (h.wound > S.t) a.push('Ferido ' + mmss(h.wound - S.t) + ' (−15% ataque e defesa)');
    if (h.dot && h.dot.until > S.t) a.push('Envenenado');
    return a.join(' · ');
  };
  G.mmss = mmss;

  /* ================= reerguer: custo pela dificuldade ================= */
  G.REVIVE_DIFF = [0.5, 1, 1.75, 3];   // Fácil, Normal (o de sempre), Difícil, Pesadelo
  G.reviveCost = (h, di) => Math.round(G.price(h, 'revive') * 2 * G.REVIVE_DIFF[di == null ? (G.S.diff == null ? 1 : G.S.diff) : di]);
  /* vida com que o caído volta: 60% sem Enfermaria; com ela, 57% + 3% por nível (até 85%) */
  G.reviveHp = (l) => { if (l == null) l = G.bOk('enfermaria') ? G.bLvl('enfermaria') : 0; return l > 0 ? Math.min(0.85, 0.57 + 0.03 * l) : 0.6; };
  G.reviveTimeAt = (lvl, l) => (70 + 2.5 * lvl) / (1 + 0.3 * l) * (l > 0 ? 1 : 2.4) / (1 + G.decorV('altar'));

  /* ================= encomendas da caravana (Mercado) ================= */
  G.ORD_REFUND = 0.75;
  G.ordOk = (k) => { const r = G.RES[k]; if (!r || !r.z || r.emb) return false; const z = G.ZONES.find((x) => x.n === r.z); return !!z && G.zoneUnlocked(z); };
  G.ordItems = () => { const o = []; for (const z of G.ZONES) if (G.zoneUnlocked(z)) { const m = G.ZMATS[z.n]; o.push(m.a, m.b, m.r); } return o; };
  G.ordPrice = (k) => Math.round(G.RES[k].base * (G.RES[k].rare ? 12 : 4.5) * (1 - Math.min(0.2, 0.02 * G.bLvl('mercado'))) * 10) / 10;
  G.ordCost = (k, n) => Math.ceil(G.ordPrice(k) * n);
  G.ordSlots = () => (G.bLvl('mercado') ? 1 + Math.floor(G.bLvl('mercado') / 3) : 0);
  G.ordMax = (k) => (G.RES[k] && G.RES[k].rare ? 10 : 100) * Math.max(1, G.bLvl('mercado'));
  G.ordCan = (k, n) => {
    const S = G.S; n = Math.floor(n);
    if (!G.bOk('mercado')) return { ok: false, why: G.bLvl('mercado') ? 'O Mercado está fechado para conserto' : 'Construa o Mercado' };
    if (!G.ordOk(k)) return { ok: false, why: 'A caravana não traz isso' };
    if (!(n >= 1) || n > G.ordMax(k)) return { ok: false, why: 'Quantidade fora do limite (até ' + G.ordMax(k) + ')' };
    if (S.orders.length >= G.ordSlots()) return { ok: false, why: 'Limite de ' + G.ordSlots() + ' encomenda(s) em aberto' };
    const c = G.ordCost(k, n); if (S.gold < c) return { ok: false, why: 'Faltam moedas', c };
    return { ok: true, c };
  };
  G.ordPlace = (k, n) => {
    const S = G.S; n = Math.floor(n); const r = G.ordCan(k, n); if (!r.ok) return null;
    G.spend(r.c, 'encomendas');
    const o = { id: G.uid(), k, n, gold: r.c, day: S.day }; S.orders.push(o);
    S.stats.ordGold = (S.stats.ordGold || 0) + r.c;
    G.log('Encomenda feita à caravana: ' + n + ' ' + G.RES[k].name + ' por ' + G.fmt(r.c) + ' moedas. Chega na alvorada.', 'gold');
    G.sfx('buy'); G.emit('orders', o); return o;
  };
  G.ordRefund = (o) => Math.floor(o.gold * G.ORD_REFUND);
  G.ordCancel = (id) => {
    const S = G.S, i = S.orders.findIndex((o) => o.id === id); if (i < 0) return 0;
    const o = S.orders[i], back = G.ordRefund(o); S.orders.splice(i, 1); G.earn(back, 'reembolso');
    G.log('Encomenda cancelada: ' + o.n + ' ' + G.RES[o.k].name + '. Voltaram ' + G.fmt(back) + ' moedas.', 'info');
    G.emit('orders', null); return back;
  };
  /* na alvorada a caravana entrega tudo direto no Armazém */
  G.ordDeliver = () => {
    const S = G.S; if (!S.orders.length) return 0;
    const got = {}; let n = 0;
    for (const o of S.orders) { G.addRes(o.k, o.n); got[o.k] = (got[o.k] || 0) + o.n; n += o.n; }
    S.stats.ordDone = (S.stats.ordDone || 0) + S.orders.length; S.orders = [];
    const txt = Object.keys(got).map((k) => '+' + got[k] + ' ' + G.RES[k].name).join(', ');
    G.log('A caravana chegou ao Mercado na alvorada: ' + txt + '. Tudo já está no Armazém.', 'good');
    G.toast('Caravana: ' + txt, 'good', 'gift'); G.emit('orders', null); G.emit('inv');
    return n;
  };

  /* ================= falas novas (só aparecem com tela) ================= */
  G.BARKS.full = ['Lotado… espero um pouco.', 'Nenhum lugar livre?', 'Fila de novo…'];
  G.BARKS.feast = ['Que banquete!', 'Comi como um rei.', 'Agora sim, pronto para a caçada!'];
  G.BARKS.cozy = ['Dormi como uma pedra.', 'Que cama macia!', 'Acordei novo.'];
  G.BARKS.cured = ['Novo em folha!', 'Nem lembro do ferimento.'];

  /* ================= ganchos ================= */
  const VERB = { eat: 'Comendo', rest: 'Descansando', heal: 'Tratando' };
  const sl0 = G.stateLabel;
  G.stateLabel = (h) => {
    if (h.state === 'inside' && h._svcB && G.SVC[h._svcB]) return VERB[h.act] + ': ' + G.SVC[h._svcB].tiers[h._svcI | 0].name;
    if (h.state === 'idle' && h._waitB && G.BLD[h._waitB] && G.S.t < h.until + 0.5) return 'Esperando vaga: ' + G.BLD[h._waitB].short;
    return sl0(h);
  };
  const dh0 = G.dayHooks;
  G.dayHooks = () => { dh0(); G.ordDeliver(); };
  const vm2 = G.vocMigrate;
  G.vocMigrate = () => {
    const S = G.S;
    if (!S.svc || typeof S.svc !== 'object') S.svc = {};
    for (const id of G.SVC_IDS) { const v = S.svc[id] | 0; S.svc[id] = v >= 0 && v <= 4 ? v : 0; }
    if (!Array.isArray(S.orders)) S.orders = [];
    S.orders = S.orders.filter((o) => o && G.RES[o.k] && G.RES[o.k].z && !G.RES[o.k].emb && o.n >= 1);
    for (const o of S.orders) { o.n = Math.floor(o.n); if (!(o.gold >= 0)) o.gold = 0; if (!(o.id > 0)) o.id = G.uid(); }
    if (!S.stats.svcT || typeof S.stats.svcT !== 'object') S.stats.svcT = {};
    for (const id of G.SVC_IDS) if (!Array.isArray(S.stats.svcT[id]) || S.stats.svcT[id].length !== 4) S.stats.svcT[id] = [0, 0, 0, 0];
    for (const k of ['waits', 'svcExtra', 'ordDone', 'ordGold']) if (S.stats[k] == null) S.stats[k] = 0;
    for (const h of S.heroes) {
      for (const k of ['fedT', 'fedA', 'fedX', 'restT', 'restF']) if (typeof h[k] !== 'number' || !isFinite(h[k])) h[k] = 0;
      h._svcB = null; h._waitB = null; h._waitN = 0;
    }
    vm2();
  };
})();

;
