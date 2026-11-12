/* 3E-renascer: v25 — Renascimento que dá vontade (lote 3-C). Pontos de Renascimento, traços raros de renascidos, nível de traço
   (I a III), compra/subida/esquecimento no Altar, prévia e progresso até renascer, item na "próxima recompensa". Só simulação (sem DOM):
   as telas ficam em 6A-ui-renascer.js. Estado por herói (inicialização preguiçosa, saves antigos continuam valendo):
   h.rr = { p: pontos, s: estrelas já premiadas, tl: { traço: nível }, sv: vezes que o Coração Imortal salvou, sp: pontos gastos, nz: pontos que
   o jogador já viu no Altar }. Quem já tinha renascido antes do Altar ganha os pontos retroativos (3 + cada estrela) em silêncio.
   Evento novo: 'rebirth' { h, pts, first, from, to } (cerimônia) e 'altar' { h, op, id, cost } a cada compra. */
'use strict';
(function () {
  /* ajustes de equilíbrio num só lugar */
  G.REB = {
    rank: 6, lvl: 70,          // requisito para renascer (Rank SS, nível 70; antes era SSS nível 80, longe demais: ver lotes/3c.md)
    pts: 3,                    // Pontos de Renascimento ao renascer: pts + a estrela nova (★1 = 4, ★2 = 5, ★3 = 6 ...)
    slots: 4, slotStars: 2,    // limite de traços: slots + floor(estrelas / slotStars)
    cBuy: 2, cRare: 3,         // custo de aprender um traço comum / raro
    cLv: [2, 3], cLvRare: [3, 4], // custo de subir de I para II e de II para III (comum / raro)
    cForget: 1,                // custo de esquecer um traço negativo
    mul: [1, 1.5, 2],          // multiplicador do efeito do traço em cada nível
    prevRank: 4,               // a ficha mostra a prévia a partir do Rank A
    near: 0.6,                 // fração do nível de renascer a partir da qual o herói aparece na "próxima recompensa"
    boost: 0.3,                // +30% em todos os atributos por estrela
  };
  const R = G.REB, MUL = R.mul;
  const fm1 = (v) => String(Math.round(v * 10) / 10).replace('.', ',');

  /* ================= traços: tipos e traços raros ================= */
  for (const id of ['medroso', 'guloso', 'generoso', 'preguicoso', 'impulsivo']) if (G.TRAITS[id]) G.TRAITS[id].neg = 1;   // negativos: não sobem de nível, podem ser esquecidos
  if (G.TRAITS.invocado) G.TRAITS.invocado.fixed = 1;                                                                      // vem do Portal: fica como está
  if (G.TRAITS.sociavel) G.TRAITS.sociavel.desc = 'Os aliados por perto ganham ânimo (+0,5 por segundo).';
  /* traços raros: só quem já renasceu aprende, no Altar. atk/crit/eva/xp/drop entram pela soma de traços; bn entra na soma de bônus do herói;
     surv é a fração de vida com que o Coração Imortal devolve o herói à luta. */
  const RARE = {
    imortal: { name: 'Coração Imortal', desc: 'Uma vez por caçada, sobrevive a um golpe fatal e volta à luta com 30% da vida.', rare: 1, surv: 0.3 },
    mao: { name: 'Mão Dourada', desc: '+24% de moedas dos abates.', rare: 1, bn: { gold: 0.24 } },
    lince: { name: 'Olhar de Lince', desc: '+6% de crítico e +20% de espólio, inclusive o raro.', rare: 1, crit: 0.06, drop: 0.2 },
    memoria: { name: 'Memória das Eras', desc: '+30% de experiência. Já percorreu este caminho.', rare: 1, xp: 0.3 },
    lunar: { name: 'Véu Lunar', desc: '+8% de esquiva e +10% de movimento.', rare: 1, eva: 0.08, bn: { spd: 0.1 } },
    eclipse: { name: 'Pulso do Eclipse', desc: 'Habilidades recarregam 12% mais rápido. +6% de ataque.', rare: 1, atk: 0.06, bn: { cdr: 0.12 } },
  };
  G.RARE_IDS = Object.keys(RARE);
  Object.assign(G.TRAITS, RARE);
  G.traitKind = (id) => { const d = G.TRAITS[id]; return !d ? '' : d.rare ? 'rare' : d.neg ? 'neg' : d.fixed ? 'fixed' : 'comum'; };
  G.traitLevelable = (id) => { const k = G.traitKind(id); return k === 'rare' || k === 'comum'; };
  G.traitLv = (h, t) => { const l = h.rr && h.rr.tl && h.rr.tl[t]; return l > 1 ? (l > 3 ? 3 : l) : 1; };
  G.traitMul = (h, t) => MUL[G.traitLv(h, t) - 1];
  /* texto do traço no nível lv: os percentuais do texto base ganham o multiplicador do nível */
  G.traitText = (id, lv) => {
    const d = G.TRAITS[id]; if (!d) return '';
    const m = MUL[(lv || 1) - 1] || 1;
    if (id === 'sociavel') return 'Os aliados por perto ganham ânimo (+' + fm1(0.5 * m) + ' por segundo).';
    if (m === 1) return d.desc;
    return d.desc.replace(/(\d+(?:,\d+)?)%/g, (s, n) => fm1(parseFloat(n.replace(',', '.')) * m) + '%');
  };
  /* a soma de traços respeita o nível de cada traço (O(traços), como antes) */
  G.traitSum = (h, key) => {
    let s = 0; const tl = h.rr && h.rr.tl;
    for (const t of h.traits) { const d = G.TRAITS[t]; if (d && d[key]) s += d[key] * (tl && tl[t] > 1 ? MUL[Math.min(3, tl[t]) - 1] : 1); }
    return s;
  };
  /* bônus que só existem na soma de bônus do herói (moedas, movimento, recarga) */
  const hb0 = G.heroBonus;
  G.heroBonus = (h) => {
    const b = hb0(h);
    for (const t of h.traits) { const d = G.TRAITS[t]; if (d && d.bn) { const m = G.traitMul(h, t); for (const k in d.bn) if (b[k] !== undefined) b[k] += d.bn[k] * m; } }
    return b;
  };

  /* ================= estado: pontos por herói ================= */
  G.rb = (h) => {
    let r = h.rr; if (!r) r = h.rr = { p: 0, s: 0, tl: {}, sv: 0, sp: 0, nz: 0 };
    const st = h.stars || 0;
    if (r.s < st) { for (let i = r.s + 1; i <= st; i++) r.p += R.pts + i; r.s = st; }      // herói que já renasceu: pontos retroativos, em silêncio
    return r;
  };
  G.rbPts = (h) => (h.stars || h.rr ? G.rb(h).p : 0);
  G.rbSlots = (h, stars) => R.slots + Math.floor((stars == null ? h.stars || 0 : stars) / R.slotStars);
  /* o herói tem algo novo para ver: pode renascer, ou pontos que o jogador ainda não olhou */
  G.rbFresh = (h) => { if (!(h.stars > 0)) return false; const r = G.rb(h); return r.p >= 2 && r.p > (r.nz || 0); };
  G.rbSeen = (h) => { const r = G.rb(h); r.nz = r.p; };

  /* ================= renascer: requisito, prévia e progresso ================= */
  G.canRebirth = (h) => h.rank >= R.rank && h.lvl >= R.lvl;
  G.rbProgress = (h) => ({ lvl: h.lvl, need: R.lvl, pct: Math.min(1, h.lvl / R.lvl), lvlLeft: Math.max(0, R.lvl - h.lvl), promoLeft: Math.max(0, R.rank - h.rank), ready: G.canRebirth(h) });
  G.rbPreview = (h) => {
    const n = (h.stars || 0) + 1, now = G.rbSlots(h), nxt = G.rbSlots(h, n);
    return { stars: n, boost: R.boost, mult: 1 + R.boost * n, gain: (1 + R.boost * n) / (1 + R.boost * (n - 1)) - 1, pts: R.pts + n, slots: nxt, slotsNow: now, newSlot: nxt > now, rare: !(h.stars > 0), xp: 0.15 };
  };

  /* ================= Altar: custos, regras e compra ================= */
  G.rbCost = (h, op, id) => {
    const d = G.TRAITS[id], rare = d && d.rare;
    if (op === 'buy') return rare ? R.cRare : R.cBuy;
    if (op === 'up') return (rare ? R.cLvRare : R.cLv)[Math.min(2, G.traitLv(h, id) - 1)];
    return R.cForget;
  };
  /* tudo o que o Altar oferece a um herói (op: buy/up/forget). Devolve { ok, cost, why } e nunca muda nada. */
  G.rbCheck = (h, op, id) => {
    const d = G.TRAITS[id], out = { ok: false, cost: 0, why: '' };
    if (!d) { out.why = 'Traço desconhecido.'; return out; }
    if (!(h.stars > 0)) { out.why = 'Só quem já renasceu usa o Altar.'; return out; }
    const r = G.rb(h), has = h.traits.indexOf(id) >= 0;
    out.cost = G.rbCost(h, op, id);
    if (op === 'buy') {
      if (has) out.why = 'Já tem este traço.';
      else if (d.neg || d.fixed) out.why = 'Este traço não pode ser aprendido.';
      else if (h.traits.length >= G.rbSlots(h)) out.why = 'Sem espaço: o limite é de ' + G.rbSlots(h) + ' traços. Esqueça um traço negativo ou renasça de novo.';
      else if ((id === 'corajoso' && h.traits.indexOf('medroso') >= 0) || (id === 'medroso' && h.traits.indexOf('corajoso') >= 0)) out.why = 'Corajoso e Medroso não convivem. Esqueça um deles antes.';
      else if (r.p < out.cost) out.why = 'Faltam ' + (out.cost - r.p) + (out.cost - r.p === 1 ? ' ponto.' : ' pontos.');
      else out.ok = true;
    } else if (op === 'up') {
      if (!has) out.why = 'O herói não tem este traço.';
      else if (!G.traitLevelable(id)) out.why = d.neg ? 'Traços negativos não sobem de nível.' : 'Este traço não sobe de nível.';
      else if (G.traitLv(h, id) >= 3) out.why = 'Já está no nível máximo (III).';
      else if (r.p < out.cost) out.why = 'Faltam ' + (out.cost - r.p) + (out.cost - r.p === 1 ? ' ponto.' : ' pontos.');
      else out.ok = true;
    } else if (op === 'forget') {
      if (!has) out.why = 'O herói não tem este traço.';
      else if (!d.neg) out.why = 'Só traços negativos podem ser esquecidos.';
      else if (r.p < out.cost) out.why = 'Falta 1 ponto.';
      else out.ok = true;
    } else out.why = 'Ação desconhecida.';
    return out;
  };
  G.rbDo = (h, op, id) => {
    const c = G.rbCheck(h, op, id); if (!c.ok) return c;
    const r = G.rb(h), d = G.TRAITS[id];
    r.p -= c.cost; r.sp += c.cost;
    if (op === 'buy') h.traits.push(id);
    else if (op === 'up') r.tl[id] = G.traitLv(h, id) + 1;
    else { h.traits.splice(h.traits.indexOf(id), 1); delete r.tl[id]; }
    r.nz = Math.min(r.nz || 0, r.p);
    h._dirty = true;
    const lv = G.traitLv(h, id), ROM = ['I', 'II', 'III'];
    if (op === 'buy') G.log(h.name + ' aprendeu ' + d.name + ' no Altar do Renascimento.', d.rare ? 'epic' : 'good');
    else if (op === 'up') G.log(h.name + ' elevou ' + d.name + ' ao nível ' + ROM[lv - 1] + '.', 'good');
    else G.log(h.name + ' deixou ' + d.name + ' para trás.', 'info');
    if (G.heroMark && ((op === 'buy' && d.rare) || (op === 'up' && lv === 3))) G.heroMark(h, op === 'buy' ? 'aprendeu o traço raro ' + d.name + ' no Altar do Renascimento' : 'elevou ' + d.name + ' ao nível III no Altar do Renascimento');
    G.emit('altar', { h, op, id, cost: c.cost });
    return c;
  };
  /* ofertas do Altar para um herói: raros e comuns positivos que ele ainda não tem */
  G.rbOffers = (h) => ({
    rare: G.RARE_IDS.filter((t) => h.traits.indexOf(t) < 0),
    comum: G.TRAIT_POOL.filter((t) => !G.TRAITS[t].neg && h.traits.indexOf(t) < 0),
  });

  /* ================= efeitos em combate ================= */
  /* Coração Imortal: uma vez por caçada, o golpe fatal deixa o herói de pé (antes da Graça do Santuário e da Transcendência) */
  const hf0 = G.heroFall;
  G.heroFall = (h, m) => {
    if (!h._ci && h.id > 0 && h.traits.indexOf('imortal') >= 0) {
      h._ci = 1;
      const st = G.heroStats(h), f = Math.min(0.9, G.TRAITS.imortal.surv * G.traitMul(h, 'imortal'));
      h.hp = Math.max(1, st.hp * f); h.dot = null; h.lastHit = G.S.t;
      G.rb(h).sv++;
      G.addFx({ t: 'healring', x: h.x, y: h.y - 0.3 }); G.addFx({ t: 'text', x: h.x, y: h.y - 1.2, s: 'Coração Imortal!', c: '#ffd35a' }); G.sfx('heal', h.x, h.y);
      G.log('O Coração Imortal de ' + h.name + ' bateu mais uma vez e o manteve de pé.', 'good');
      return false;
    }
    return hf0(h, m);
  };
  /* 1×/s: o Coração Imortal se renova quando o herói volta à cidade; 1×/2 s: o Sociável contagia o ânimo dos aliados por perto */
  let t1 = 0, t2 = 0;
  const tk0 = G.tick;
  G.tick = (dt) => {
    tk0(dt);
    t1 += dt; if (t1 < 1) return; t1 = 0;
    const hs = G.S.heroes; t2++;
    for (const h of hs) if (h._ci && (h.inside || h.state === 'town' || h.state === 'idle' || h.state === 'goto' || h.state === 'recover')) h._ci = 0;
    if (t2 >= 2) {
      t2 = 0;
      for (const h of hs) {
        if (h.inside || h.state === 'fallen' || h.state === 'recover' || h.traits.indexOf('sociavel') < 0) continue;
        const g = 1 * G.traitMul(h, 'sociavel');
        for (const a of hs) if (a !== h && !a.inside && a.state !== 'fallen' && a.state !== 'recover' && Math.abs(a.x - h.x) < 4.5 && Math.hypot(a.x - h.x, a.y - h.y) < 4.5) a.animo = Math.min(100, a.animo + g);
      }
    }
  };

  /* ================= renascer: pontos, evento da cerimônia ================= */
  const rb0 = G.rebirth;
  G.rebirth = (h) => {
    if (!G.canRebirth(h)) return false;
    const r0 = G.rb(h), p0 = r0.p, from = { stars: h.stars || 0, lvl: h.lvl, rank: h.rank, mult: 1 + R.boost * (h.stars || 0) }, first = !(h.stars > 0), pv = G.rbPreview(h);
    if (!rb0(h)) return false;
    const r = G.rb(h), pts = r.p - p0;
    G.log(h.name + ' recebeu ' + pts + ' Pontos de Renascimento para gastar no Altar' + (first ? ' e já pode aprender traços raros' : '') + '.', 'epic');
    G.addFx({ t: 'promo', x: h.x, y: h.y });
    G.emit('rebirth', { h, pts, first, from, to: { stars: h.stars, lvl: h.lvl, rank: h.rank, mult: pv.mult }, slots: pv.slots, newSlot: pv.newSlot });
    return true;
  };
  /* herói de save antigo que já renasceu ganha os pontos ao abrir o jogo */
  const al0 = G.afterLoad;
  G.afterLoad = () => { al0(); for (const h of G.S.heroes) if (h.stars) G.rb(h); };
  /* a missão "Renasça um herói" diz o requisito certo */
  for (const q of G.QUESTS) if (q.t === 'Renasça um herói') q.h = 'No nível ' + R.lvl + ' de Rank ' + G.RANKS[R.rank] + ' (ou mais), o herói pode renascer mais forte.';

  /* ================= próxima recompensa: renascer, pontos novos e herói perto ================= */
  const nr0 = G.nextReward;
  G.nextReward = () => {
    const r = nr0(), S = G.S;
    let near = null, pend = null;
    for (const h of S.heroes) {
      if (G.canRebirth(h)) { r.all.push({ id: 'rn' + h.id, k: 'Renascimento', t: h.name + ' pode renascer', ic: 'star', cur: 1, n: 1, pct: 1, ready: true, go: 'herod:' + h.id, pr: 1.5, rk: 1 }); continue; }
      const pr = h.lvl / R.lvl;
      if (pr >= R.near && h.rank >= R.prevRank && (!near || pr > near.pct)) near = { id: 'rn' + h.id, k: 'Renascimento', t: h.name + ' · nível ' + h.lvl + '/' + R.lvl, ic: 'star', cur: h.lvl, n: R.lvl, pct: pr, ready: false, go: 'herod:' + h.id, pr: 5, rk: pr };
      if (G.rbFresh(h) && (!pend || G.rb(h).p > pend.p)) pend = { h, p: G.rb(h).p };
    }
    if (near) r.all.push(near);
    if (pend) r.all.push({ id: 'rp' + pend.h.id, k: 'Altar', t: pend.h.name + ' tem ' + pend.p + ' Pontos de Renascimento', ic: 'spark', cur: 1, n: 1, pct: 1, ready: true, go: 'altar:' + pend.h.id, pr: 4.6, rk: 1 });
    const ready = r.all.filter((o) => o.ready).sort((a, b) => a.pr - b.pr);
    r.best = ready.length ? ready[0] : r.all.slice().sort((a, b) => b.rk - a.rk || a.pr - b.pr)[0] || null;
    return r;
  };
})();

;
