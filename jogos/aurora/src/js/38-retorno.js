/* 38-retorno: v24 — voltar é um presente. Cartas de retorno (achados do tempo fora), calendário de 7 dias, criatura da
   sorte e semana temática. Só simulação, sem DOM: as telas ficam em 64-ui-retorno.js. */
'use strict';
(function () {
  /* dia civil do aparelho (número de dias desde 1970, no fuso local). Sempre via Date.now(), nunca new Date() sem argumento */
  const dayNum = (ms) => { const d = new Date(ms == null ? Date.now() : ms); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); };
  G.dayNum = dayNum;

  /* ---------- estado (inicialização preguiçosa: saves antigos continuam valendo) ---------- */
  G.ret = () => {
    const S = G.S, r = S.ret || (S.ret = {});
    if (!r.cal) r.cal = { n: 0, last: 0, shown: 0, arm: 0, cyc: 0, ld: 0 };   // n = dias já recebidos no ciclo; ld = último dia recebido (1–7)
    if (r.off === undefined) r.off = null;                                  // retorno pendente: { secs, gold, kills, mats, xp, cards }
    return r;
  };
  G.luckyState = () => { const S = G.S; return S.lucky || (S.lucky = { next: 0, n: 0 }); };
  const sc = () => ({ pm: G.PM(G.avgHeroLvl()), R: G.S.realm.lvl });

  /* ================= semana temática ================= */
  /* semana ISO real (segunda a domingo, pelo relógio do aparelho). A rotação é determinística: a semana de número
     floor((dia+3)/7) usa a temática [semana mod 4]. Os bônus dependem só de Date: valem também no simulador sem tela. */
  G.WEEKS = [
    { id: 'forja', name: 'Semana da Forja', short: 'Forja', icon: 'hammer', col: '#ffb040', eff: '+1 grau de raridade em metade das peças',
      desc: 'Os martelos de Aurora cantam mais alto. Em metade das peças forjadas, a raridade sobe um grau: Comum vira Incomum, Raro vira Épico, e assim por diante. Vale para a forja manual, para as encomendas automáticas e para a Obra-prima.' },
    { id: 'cacada', name: 'Semana da Caçada', short: 'Caçada', icon: 'sword', col: '#7df09a', eff: '+30% de espólio',
      desc: 'Os monstros estão carregados. Todo abate rende 30% mais materiais, em todas as zonas. Combina com a Sorte da criatura e com as bênçãos de colheita.' },
    { id: 'portal', name: 'Semana do Portal', short: 'Portal', icon: 'portal', col: '#c9a4ff', eff: 'recrutas melhores',
      desc: 'O Portal está generoso. Cada recruta tem 40% de chance de chegar um grau de raridade acima, e um pouco mais experiente. Vale para contratar com moedas e para invocar com Núcleos, e a Garantia do Portal continua contando.' },
    { id: 'ouro', name: 'Semana do Ouro', short: 'Ouro', icon: 'coin', col: '#ffd35a', eff: '+25% de moedas dos abates',
      desc: 'O ouro corre solto: as moedas que os heróis tiram dos monstros rendem 25% mais. Quanto mais eles gastam na cidade, mais o cofre enche.' },
  ];
  G.weekForce = null;                         // testes: 'forja' | 'cacada' | 'portal' | 'ouro' | 'none'
  let wkC = null;
  const weekOf = (dn, now) => {
    const idx = Math.floor((dn + 3) / 7), dow = (dn + 3) % 7;      // dow 0 = segunda
    const d = new Date(now); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + 7 - dow);
    return { dn, idx, endsAt: d.getTime(), w: G.WEEKS[idx % 4] };
  };
  G.week = () => {
    const now = Date.now(), dn = dayNum(now);
    if (!wkC || wkC.dn !== dn) { wkC = weekOf(dn, now); wkC.out = {}; }
    let w = wkC.w;
    if (G.weekForce) w = G.weekForce === 'none' ? { id: 'none', name: '', short: '', icon: 'star', col: '#fff', eff: '', desc: '' } : G.WEEKS.find((x) => x.id === G.weekForce) || w;
    return Object.assign(wkC.out, w, { endsAt: wkC.endsAt, left: Math.max(0, wkC.endsAt - now), idx: wkC.idx });
  };
  G.weekIs = (id) => G.week().id === id;
  /* as quatro próximas temáticas, a partir da atual (0 = esta semana) */
  G.weekNext = (n) => { const b = G.week(); const i = (b.idx + n) % 4; return G.WEEKS[i]; };
  /* "3d 4h", "5h 12min", "40min" */
  G.fmtLeft = (ms) => {
    const m = Math.max(0, Math.ceil(ms / 60000)), d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mi = m % 60;
    return d > 0 ? d + 'd ' + h + 'h' : h > 0 ? h + 'h ' + (mi < 10 ? '0' : '') + mi + 'min' : mi + 'min';
  };
  /* multiplicadores que dependem do relevo da semana e da Sorte da criatura */
  G.lootMult = () => { const S = G.S; return (G.weekIs('cacada') ? 1.3 : 1) * (S && S.ev.buff.sorte > S.t ? 1.5 : 1); };
  G.goldMult = () => (G.weekIs('ouro') ? 1.25 : 1);
  G.sorteLeft = () => { const S = G.S; return S ? Math.max(0, (S.ev.buff.sorte || 0) - S.t) : 0; };
  /* ganchos: o abate já multiplica por G.bless('fortuna') (moedas) e G.bless('colheita') (espólio) */
  const bl0 = G.bless;
  G.bless = (id) => (id === 'colheita' ? bl0(id) * G.lootMult() : id === 'fortuna' ? bl0(id) * G.goldMult() : bl0(id));
  /* Semana da Forja: metade das peças sobe um grau (mistura das chances atuais com as chances deslocadas um grau) */
  const rw0 = G.rarWeights;
  G.rarWeights = (master) => {
    const w = rw0(master);
    if (!G.weekIs('forja')) return w;
    const up = [0, w[0], w[1], w[2], w[3], w[4] + w[5]];
    return w.map((v, i) => 0.5 * v + 0.5 * up[i]);
  };
  /* Semana do Portal: por fora da Garantia do Portal (1-A). Se a melhoria produzir um Épico, o contador zera como se ele
     tivesse vindo no sorteio; se a garantia já disparou, nada muda. */
  const rc1 = G.rollCandidates;
  G.rollCandidates = (kind) => {
    const out = rc1(kind);
    if (!G.weekIs('portal')) return out;
    const lv = Math.max(1, Math.round(G.avgHeroLvl() * 0.6 * 1.2));
    for (const c of out) {
      if (c.rar < 4 && Math.random() < 0.4) { c.rar++; c.traits = G.rollTraits(c.rar >= 3 ? 3 : 2); }
      c.lvl = Math.max(c.lvl, lv);
    }
    if (kind !== 'nucleo') { const sr = G.S.sorte; if (sr && !sr.last && out.some((c) => c.rar >= 3)) sr.pity = 0; }
    return out;
  };

  /* ================= prêmios (cartas, calendário, criatura) ================= */
  /* caixa de materiais de uma zona aberta (as mais avançadas saem mais) */
  const matBox = (mult) => {
    const zs = G.ZONES.filter(G.zoneUnlocked), z = G.wpick(zs.map((x, i) => [x, i + 1])), zm = G.ZMATS[z.n];
    const base = (6 + G.S.realm.lvl) * mult * G.rnd(0.9, 1.1), o = {};
    o[zm.a] = Math.max(2, Math.round(base)); o[zm.b] = Math.max(1, Math.round(base * 0.7));
    return o;
  };
  /* peça de presente (como se a Gilda tivesse forjado): escolhe uma vaga que ajuda um herói e sorteia as inscrições do lote 1-A.
     o.rar = raridade forçada; sem ela, sorteia pelas chances da forja sem a Comum (a peça sempre nasce com inscrições). */
  G.rollGift = (o) => {
    o = o || {};
    const S = G.S, mt = Math.max(1, G.forgeMaxTier()), opts = [];
    for (const h of S.heroes) for (const [slot, type] of G.heroSlots(h)) {
      if (!G.gearUnlocked(type)) continue;
      const cur = h.gear[slot]; let t = mt; while (t > 1 && G.TIER_LVL(t) > h.lvl + 6) t--;
      opts.push([{ type, tier: t }, 1 + (cur ? Math.max(0, t - cur.tier) * 2 : 4)]);
    }
    const pk = opts.length ? G.wpick(opts) : { type: 'espada', tier: 1 };
    let rar = o.rar;
    if (rar == null) rar = G.wpick(G.rarWeights(false).map((v, i) => [i, i === 0 ? 0 : v]));
    return { type: pk.type, tier: pk.tier, rar, ins: G.rollIns(rar, pk.tier, !!o.master) };
  };
  /* entrega a peça no Armazém (sem custo). quiet = sem cerimônia de raridade (a carta já é a revelação) */
  G.giveItem = (d, quiet) => {
    const S = G.S, it = { id: G.uid(), type: d.type, tier: d.tier, rar: d.rar, plus: 0, forSale: true, ins: d.ins.map((e) => e.slice()) };
    S.inv.push(it);
    const pf = G.insPerfect(it.ins); if (pf) S.stats.perfect = (S.stats.perfect || 0) + pf;
    G.log('Presente: ' + G.itemName(it) + ' — ' + G.RAR[it.rar] + '.', it.rar >= 3 ? 'epic' : 'good');
    G.emit('inv');
    if (!quiet) G.revealForge(it, false);
    return it;
  };
  /* aplica um prêmio { gold, nucleos, selos, res:{id:n}, it } direto no jogo, sem passar pelo relatório do dia (não infla a estimativa offline) */
  G.prizeGive = (p, o) => {
    const S = G.S; o = o || {};
    if (p.gold) { S.gold += p.gold; S.stats.goldIn += p.gold; }
    if (p.nucleos) S.nucleos += p.nucleos;
    if (p.selos) S.selos += p.selos;
    if (p.res) for (const k in p.res) G.addRes(k, p.res[k]);
    return p.it ? G.giveItem(p.it, !!o.quiet) : null;
  };
  /* lista legível do prêmio: [{ i: ícone, id, n, t }] */
  G.prizeParts = (p) => {
    const out = [];
    if (p.gold) out.push({ i: 'coin', n: p.gold, t: G.fmt(p.gold) + ' moedas' });
    if (p.nucleos) out.push({ i: 'core', n: p.nucleos, t: p.nucleos + (p.nucleos > 1 ? ' Núcleos' : ' Núcleo') });
    if (p.selos) out.push({ i: 'seal', n: p.selos, t: p.selos + (p.selos > 1 ? ' Selos' : ' Selo') });
    if (p.res) for (const k in p.res) out.push({ i: 'res', id: k, n: p.res[k], t: G.fmt(p.res[k]) + ' ' + G.RES[k].name });
    if (p.it) out.push({ i: 'gear', n: 1, t: G.GEAR[p.it.type].name + ' ' + G.tierName(p.it.tier) + ' (' + G.RAR[p.it.rar] + ')' });
    return out;
  };
  G.prizeText = (p) => G.prizeParts(p).map((x) => x.t).join(', ');

  /* ================= 1B.1 achados do tempo fora ================= */
  const RM = [1, 1.6, 2.6, 4.2, 7];          // multiplicador da quantia por raridade da carta (Comum … Lendário)
  G.RET_TITLE = { gold: 'Saco de moedas', mat: 'Caixa de materiais', cons: 'Provisões', nuc: 'Núcleo', selo: 'Selo de Renome', po: 'Pó de Reforja', gear: 'Peça da Gilda' };
  const prizeOf = (k, r) => {
    const { pm, R } = sc(), m = RM[r];
    switch (k) {
      case 'gold': return { gold: Math.round(60 * pm * (1 + 0.035 * R) * m * G.rnd(0.9, 1.1)) };
      case 'mat': return { res: matBox(m) };
      case 'cons': { const n = Math.max(2, Math.round((3 + 0.35 * R) * m * G.rnd(0.9, 1.1))); return { res: { pocao: n, refeicao: n } }; }
      case 'nuc': return { nucleos: [1, 1, 2, 3, 5][r] };
      case 'selo': return { selos: [1, 1, 2, 3, 4][r] };
      default: return { res: { po_reforja: Math.max(2, Math.round((2 + 0.25 * R) * m)) } };     // 'po'
    }
  };
  /* uma carta por hora fora (1 a 8; nenhuma se o tempo fora foi menor que 10 min) */
  G.retCount = (secs) => (secs >= 600 ? Math.min(8, Math.max(1, Math.floor(secs / 3600))) : 0);
  G.retRollCards = (secs) => {
    const n = G.retCount(secs), out = [], ferr = G.bOk('ferraria'), po = G.bLvl('ferraria') >= 2;
    for (let i = 0; i < n; i++) {
      const k = G.wpick([['gold', 30], ['mat', 24], ['cons', 18], ['nuc', 8], ['selo', 8], ['po', po ? 8 : 0], ['gear', ferr ? 10 : 0]]);
      let r = G.wpick([[0, 46], [1, 28], [2, 16], [3, 7], [4, 3]]), p;
      if (k === 'gear') { const g = G.rollGift(); r = g.rar; p = { it: g }; } else p = prizeOf(k, r);
      out.push({ k, r, p, st: 0 });
    }
    return out;
  };
  /* vira (e entrega) a carta i; devolve a carta, ou null se já estava virada */
  G.retFlip = (i) => {
    const o = G.ret().off, c = o && o.cards[i];
    if (!c || c.st) return null;
    c.st = 1; G.prizeGive(c.p, { quiet: true });
    return c;
  };
  /* fechou a janela: entrega o que ficou sem virar e encerra o retorno. Devolve quantas cartas entregou agora */
  G.retFinish = () => {
    const r = G.ret(), o = r.off; if (!o) return 0;
    let n = 0; for (let i = 0; i < o.cards.length; i++) if (G.retFlip(i)) n++;
    r.off = null;
    return n;
  };
  /* o sorteio é gravado em S.ret.off ANTES de a janela abrir (M.start salva logo depois): reabrir a página reapresenta as
     mesmas cartas, nunca sorteia de novo. Cartas pendentes de um retorno anterior são entregues antes de criar o novo. */
  /* v27 (A1): o resumo do retorno (3J-ausencia) já traz tudo o que o reino fez; as cartas entram nele pelo gancho G.offHooks, no mesmo fluxo e
     na mesma janela. As cartas seguem a quantidade de HORAS REAIS fora (o.secs, até 16 h), não o tempo simulado. */
  G.offHooks.push((o) => {
    G.retFinish();
    const cards = G.retRollCards(o.secs);
    if (cards.length) G.ret().off = Object.assign({}, o, { cards });
    o.cards = cards;
  });

  /* ================= 1B.2 calendário de 7 dias ================= */
  G.CAL = [
    { n: 'Saco de moedas', d: 'Moedas para o cofre', i: 'coin' },
    { n: 'Provisões', d: 'Poções e refeições', i: 'potion' },
    { n: 'Materiais', d: 'Caixa das zonas abertas', i: 'bag' },
    { n: '2 Núcleos', d: 'Para o Portal e a Obra-prima', i: 'core' },
    { n: '2 Selos', d: 'Selos de Renome (e Pó de Reforja)', i: 'seal' },
    { n: 'Tesouro', d: '3 Núcleos e um bom punhado de moedas', i: 'chest' },
    { n: 'Baú Lendário', d: 'Peça Épica ou melhor com inscrições', i: 'crown' },
  ];
  /* o prêmio escala com o progresso (poder dos heróis e Nível do Reino). preview = sem sortear a peça do baú */
  G.calPrize = (day, preview) => {
    const { pm, R } = sc(), f = pm * (1 + 0.04 * R), po = G.bLvl('ferraria') >= 2;
    switch (day) {
      case 1: return { gold: Math.round(150 * f) };
      case 2: { const n = Math.round(8 + 0.5 * R); return { res: { pocao: n, refeicao: n } }; }
      case 3: return { res: matBox(2.2) };
      case 4: return { nucleos: 2 };
      case 5: return po ? { selos: 2, res: { po_reforja: Math.round(5 + 0.4 * R) } } : { selos: 2 };
      case 6: return { nucleos: 3, gold: Math.round(400 * f) };
      default:
        if (!G.bOk('ferraria')) return { nucleos: 10, selos: 3 };         // sem Ferraria: Núcleos de sobra no lugar da peça
        return preview ? { nucleos: 3, selos: 2, chest: 1 } : { nucleos: 3, selos: 2, chest: 1, it: G.rollGift({ rar: G.wpick([[3, 72], [4, 25], [5, 3]]) }) };
    }
  };
  /* estado: n dias já recebidos no ciclo (0–6); next = dia a receber; ok = pode receber hoje (1 por dia real, 0 se já recebeu hoje) */
  G.calState = () => {
    const c = G.ret().cal, today = dayNum(), got = c.last === today;
    return { n: c.n, next: c.n + 1, ok: !got, got, today, cyc: c.cyc };
  };
  /* perder dias não zera nem pune: o ciclo só espera. Receber o dia 7 fecha o ciclo e o próximo dia real recomeça no dia 1 */
  G.calClaim = () => {
    const st = G.calState(); if (!st.ok) return null;
    const c = G.ret().cal, day = st.next, p = G.calPrize(day);
    const it = G.prizeGive(p, { quiet: false });
    c.last = st.today; c.ld = day; c.n = day >= 7 ? 0 : day; if (day >= 7) c.cyc++;
    G.S.stats.calDays = (G.S.stats.calDays || 0) + 1;
    G.log('Calendário de Aurora, dia ' + day + ': ' + G.prizeText(p) + '.', day >= 7 ? 'epic' : 'good');
    G.emit('daily');
    return { day, p, it };
  };

  /* ================= 1B.3 criatura da sorte (só com tela) ================= */
  G.lucky = null;
  /* sorteia e aplica o prêmio do toque */
  G.luckyPrize = () => {
    const S = G.S, { pm, R } = sc(), kind = G.wpick([['chuva', 34], ['sorte', 28], ['nucleo', 14], ['mats', 24]]);
    if (kind === 'chuva') { const g = Math.round(140 * pm * (1 + 0.04 * R) * G.rnd(0.85, 1.25)); G.prizeGive({ gold: g }); return { kind, p: { gold: g }, text: 'Chuva de moedas! +' + G.fmt(g) + ' moedas.' }; }
    if (kind === 'sorte') { S.ev.buff.sorte = Math.max(S.ev.buff.sorte || 0, S.t) + 60; return { kind, p: {}, text: 'Sorte por 60 segundos: +50% de espólio!' }; }
    if (kind === 'nucleo') { const n = Math.random() < 0.15 ? 2 : 1; G.prizeGive({ nucleos: n }); return { kind, p: { nucleos: n }, text: '+' + n + (n > 1 ? ' Núcleos' : ' Núcleo') + ' da criatura da sorte!' }; }
    const res = matBox(1.6); G.prizeGive({ res }); return { kind, p: { res }, text: 'Materiais: ' + G.prizeText({ res }) + '.' };
  };
  G.luckySpawn = (v) => {
    const S = G.S, L = G.luckyState(); if (G.lucky || !v) return false;
    const dir = Math.random() < 0.5 ? 1 : -1;
    G.lucky = { x: dir > 0 ? v.x0 - 2.2 : v.x1 + 2.2, y: v.y0 + (v.y1 - v.y0) * G.rnd(0.3, 0.6), yc: 0, dir, sp: 1.5 * G.rnd(0.9, 1.15), t: 0, life: 20, ph: G.rnd(0, 6.28), in: false, tr: [], trT: 0, done: 0 };
    G.lucky.yc = G.lucky.y;
    L.next = S.t + 400;                      // enquanto ela está por aí o relógio não corre (ajustado ao sumir)
    G.emit('lucky', { t: 'spawn', c: G.lucky });
    return true;
  };
  const luckyEnd = (caught) => {
    const S = G.S, L = G.luckyState(), c = G.lucky;
    G.lucky = null; if (c) c.done = 1;
    L.next = S.t + G.rnd(180, 360);          // a cada 3 a 6 minutos de jogo (já escalado pela velocidade)
    return c;
  };
  G.luckyTap = () => {
    const c = G.lucky; if (!c || c.done) return null;
    luckyEnd(true);
    const L = G.luckyState(); L.n++; G.S.stats.lucky = L.n;
    const pr = G.luckyPrize();
    G.log('A criatura da sorte deixou um presente: ' + pr.text, 'good');
    G.emit('lucky', { t: 'caught', x: c.x, y: c.y, kind: pr.kind, text: pr.text, p: pr.p });
    return pr;
  };
  const luckyTick = (dt) => {
    const S = G.S, L = G.luckyState(), rdt = dt / Math.max(1, S.speed || 1);     // movimento em tempo real; o intervalo usa o relógio do jogo
    if (!L.next || L.next - S.t > 420) L.next = S.t + G.rnd(150, 270);
    let c = G.lucky;
    if (!c) {
      if (S.t < L.next || !S.tut.done || S.mare.active) return;
      G.luckySpawn(G.luckyView());
      return;
    }
    const v = G.luckyView(); if (!v) return;                                      // painel aberto cobrindo o mapa: ela espera
    c.t += rdt;
    c.x += c.dir * c.sp * rdt;
    if (!c.in) { if (c.x > v.x0 + 0.5 && c.x < v.x1 - 0.5) c.in = true; }
    else {                                                                         // dentro da vista: quica nas bordas e segue a câmera
      if (c.x > v.x1 - 0.7) c.dir = -1; else if (c.x < v.x0 + 0.7) c.dir = 1;
      const tx = G.clamp(c.x, v.x0 + 0.3, v.x1 - 0.3); c.x += (tx - c.x) * Math.min(1, rdt * 4);
    }
    const band0 = v.y0 + (v.y1 - v.y0) * 0.22, band1 = v.y0 + (v.y1 - v.y0) * 0.78;
    c.yc += (G.clamp(c.yc, band0, band1) - c.yc) * Math.min(1, rdt * 3);
    c.y = c.yc + Math.sin(c.t * 1.9 + c.ph) * 0.9 + Math.sin(c.t * 0.55 + c.ph) * 1.3;
    c.trT -= rdt; if (c.trT <= 0) { c.trT = 0.05; c.tr.push({ x: c.x, y: c.y, a: 0 }); }
    for (let i = c.tr.length - 1; i >= 0; i--) { c.tr[i].a += rdt; if (c.tr[i].a > 0.9) c.tr.splice(i, 1); }
    if (c.t >= c.life) { luckyEnd(false); G.emit('lucky', { t: 'puf', x: c.x, y: c.y }); }
  };
  const tk0 = G.tick;
  G.tick = (dt) => { tk0(dt); if (!G.HEADLESS && !G.OFFLINE && G.S && G.luckyView) luckyTick(dt); };
  const ng1 = G.newGame; G.newGame = () => { G.lucky = null; return ng1(); };
  const al1 = G.afterLoad; G.afterLoad = () => { G.lucky = null; return al1(); };
})();

;
