/* 37-forja-sorte: v23 — a forja vira loteria (inscrições aleatórias nas peças, reforja, Pó de Reforja,
   cerimônia de raridade), garantia do Portal e jogo novo sem janelas de novidades antigas. Sem DOM. */
'use strict';
(function () {
  /* ================= jogo novo: as janelas de novidades são para quem vem de versões antigas ================= */
  const ng0 = G.newGame;
  G.newGame = () => {
    const S = ng0();
    S.tut.seen = S.tut.seen || {};
    S.tut.seen.v20 = S.tut.seen.v21 = S.tut.seen.v22 = S.tut.seen.v24 = S.tut.seen.v25 = S.tut.seen.v26 = S.tut.seen.v27 = 1;
    return S;
  };

  /* ================= Pó de Reforja ================= */
  /* recurso especial (não se vende nem se compra): sai do desmonte de peças e paga a Reforja */
  G.RES.po_reforja = { name: 'Pó de Reforja', shape: 'pile', c: ['#e8744a', '#9a3a1c', '#ffd2a0'], rare: 1, sp: 1, base: 30 };

  /* ================= Inscrições ================= */
  /* Cada peça Incomum ou melhor nasce com inscrições sorteadas. Cada inscrição tem uma qualidade de 1 a 5
     (5 = perfeita). Valor = base × multiplicador da qualidade × fator do nível da peça.
     k = chave do total somado no herói · v = valor base (qualidade 3, nível 6) · sc = peso na pontuação da peça (escolha de peças dos heróis);
     pw = peso de exibição do Poder da peça (v24: calibrado pelo efeito real no poder do herói; ver 3B-clareza). */
  const pc = (v) => { const x = v * 100; return (x < 10 ? x.toFixed(1) : String(Math.round(x))).replace('.', ','); };
  G.INS = {
    furia:       { name: 'da Fúria',       k: 'atk',     v: 0.06,  sc: 200,  txt: (v) => '+' + pc(v) + '% de ataque' },
    colosso:     { name: 'do Colosso',     k: 'hp',      v: 0.07,  sc: 150, pw: 200,  txt: (v) => '+' + pc(v) + '% de vida' },
    muralha:     { name: 'da Muralha',     k: 'def',     v: 0.08,  sc: 90,  pw: 56,   txt: (v) => '+' + pc(v) + '% de defesa' },
    falcao:      { name: 'do Falcão',      k: 'crit',    v: 0.03,  sc: 140,  txt: (v) => '+' + pc(v) + '% de chance crítica' },
    ruina:       { name: 'da Ruína',       k: 'critDmg', v: 0.12,  sc: 25,  pw: 19,   txt: (v) => '+' + pc(v) + '% de dano crítico' },
    vendaval:    { name: 'do Vendaval',    k: 'aspd',    v: 0.05,  sc: 200,  txt: (v) => '+' + pc(v) + '% de velocidade de ataque' },
    sanguessuga: { name: 'da Sanguessuga', k: 'ls',      v: 0.025, sc: 300, pw: 280,  txt: (v) => 'Rouba ' + pc(v) + '% do dano como vida' },
    fonte:       { name: 'da Fonte',       k: 'regen',   v: 0.004, sc: 4000, pw: 6000, txt: (v) => 'Regenera ' + pc(v) + '% da vida por segundo' },
    nevoa:       { name: 'da Névoa',       k: 'eva',     v: 0.025, sc: 200, pw: 220,  txt: (v) => '+' + pc(v) + '% de esquiva' },
    mercador:    { name: 'do Mercador',    k: 'gold',    v: 0.08,  sc: 100, pw: 80,   txt: (v) => '+' + pc(v) + '% de moedas dos abates' },
    garimpo:     { name: 'do Garimpo',     k: 'drop',    v: 0.08,  sc: 100, pw: 80,   txt: (v) => '+' + pc(v) + '% de espólio' },
    sabio:       { name: 'do Sábio',       k: 'xp',      v: 0.08,  sc: 120, pw: 100,  txt: (v) => '+' + pc(v) + '% de experiência' },
    algoz:       { name: 'do Algoz',       k: 'elite',   v: 0.10,  sc: 60,   txt: (v) => '+' + pc(v) + '% de dano contra elites e chefes' },
    espinhos:    { name: 'dos Espinhos',   k: 'thorns',  v: 0.06,  sc: 200, pw: 140,  txt: (v) => 'Devolve ' + pc(v) + '% do dano recebido' },
    mestria:     { name: 'da Mestria',     k: 'cdr',     v: 0.04,  sc: 150, pw: 60,   txt: (v) => '-' + pc(v) + '% de recarga das habilidades' },
    peregrino:   { name: 'do Peregrino',   k: 'spd',     v: 0.06,  sc: 40,  pw: 32,   txt: (v) => '+' + pc(v) + '% de velocidade de movimento' },
  };
  G.INS_IDS = Object.keys(G.INS);
  G.INS_Q = ['', 'Tosca', 'Simples', 'Boa', 'Fina', 'Perfeita'];
  G.INS_QM = [0, 0.55, 0.8, 1, 1.25, 1.6];
  G.INS_QCOL = ['', '#a9b1c2', '#74d08a', '#5bb3f0', '#b58cf2', '#ffd35a'];
  G.INS_COUNT = [[0, 0], [1, 1], [1, 2], [2, 2], [3, 3], [4, 4]];        // por raridade: Comum … Mítico
  G.INS_QW = [null, [34, 30, 22, 10, 4], [28, 28, 24, 14, 6], [22, 26, 26, 17, 9], [16, 22, 28, 21, 13], [10, 18, 28, 25, 19]]; // chance de qualidade 1..5
  /* rótulos dos totais somados no herói (para a ficha) */
  G.INS_TOT = { atk: ['Ataque', 1], hp: ['Vida', 1], def: ['Defesa', 1], crit: ['Crítico', 1], critDmg: ['Dano crítico', 1], aspd: ['Vel. de ataque', 1], ls: ['Roubo de vida', 1], regen: ['Regeneração/s', 1], eva: ['Esquiva', 1], gold: ['Moedas', 1], drop: ['Espólio', 1], xp: ['Experiência', 1], elite: ['Dano em elites/chefes', 1], thorns: ['Espinhos', 1], cdr: ['Recarga', 1], spd: ['Movimento', 1] };

  /* sorteia o conjunto de inscrições de uma peça; obra-prima sorteia cada qualidade duas vezes e fica com a melhor */
  G.rollIns = (rar, tier, master) => {
    const cr = G.INS_COUNT[rar] || G.INS_COUNT[0], n = G.ri(cr[0], cr[1]);
    if (!n) return [];
    const ids = G.shuffle(G.INS_IDS.slice()).slice(0, n);
    const w = (G.INS_QW[rar] || G.INS_QW[1]).map((x, i) => [i + 1, x]);
    const out = ids.map((id) => [id, master ? Math.max(G.wpick(w), G.wpick(w)) : G.wpick(w)]);
    out.sort((a, b) => b[1] - a[1]);
    return out;
  };
  const tierF = (tier) => 0.85 + 0.03 * Math.min(10, Math.max(0, tier - 1));
  G.insVal = (it, id, q) => G.INS[id].v * G.INS_QM[q] * tierF(it.tier);
  G.insText = (it, id, q) => G.INS[id].txt(G.insVal(it, id, q));
  G.insPerfect = (list) => { let n = 0; if (list) for (const e of list) if (e[1] >= 5) n++; return n; };
  /* soma das inscrições de um conjunto de peças (os equipados de um herói) */
  G.insSum = (items) => {
    const T = {};
    for (const k in G.INS_TOT) T[k] = 0;
    for (const it of items) {
      if (!it || !it.ins) continue;
      for (const e of it.ins) { const d = G.INS[e[0]]; if (d) T[d.k] += G.insVal(it, e[0], e[1]); }
    }
    return T;
  };
  G.insHero = (h) => { const a = []; for (const k in h.gear) if (h.gear[k]) a.push(h.gear[k]); return G.insSum(a); };
  G.insAny = (T) => { for (const k in T) if (T[k]) return true; return false; };

  /* cerimônia de raridade: Épico+ revela com clarão, feixe de luz sobre a Ferraria e uma carta (o resto é com a UI).
     Em forja silenciosa (encomenda automática): só um aviso com o nome; a carta e o feixe ficam para Lendário+. */
  G.revealForge = (it, silent) => {
    if (it.rar < 3) return;
    const big = it.rar >= 4, p = G.W.plots.ferraria;
    if (silent) { G.toast(G.RAR[it.rar] + ': ' + G.itemName(it) + '!', 'epic', 'hammer'); if (!big) return; }
    if (p) G.addFx({ t: 'rarbeam', x: p.cx, y: p.cy, c: G.RAR_COLOR[it.rar], big });
    G.emit('reveal', { it, silent: !!silent, big });
  };

  /* toda peça nova nasce com inscrições (forja manual, obra-prima e encomendas automáticas) */
  const craft0 = G.craft;
  G.craft = (type, tier, master, silent) => {
    const it = craft0(type, tier, master, silent);
    if (it) {
      if (!it.ins) it.ins = G.rollIns(it.rar, it.tier, master);
      if (G.insPerfect(it.ins)) G.S.stats.perfect = (G.S.stats.perfect || 0) + G.insPerfect(it.ins);
      G.emit('inv');
      G.revealForge(it, !!silent);
    }
    return it;
  };

  /* efeitos nos atributos do herói: aplicados uma vez a cada recálculo (o cache de G.heroStats cuida do resto) */
  const hs0 = G.heroStats;
  G.heroStats = (h) => {
    const prev = h._st, st = hs0(h);
    if (st === prev) return st;                     // veio do cache, já com as inscrições
    st.ls = 0; st.regen = 0;
    if (!h.gear) return st;
    const T = G.insHero(h);
    if (!G.insAny(T)) return st;
    st.atk *= 1 + T.atk; st.def *= 1 + T.def; st.hp = Math.round(st.hp * (1 + T.hp));
    st.crit = Math.min(0.75, st.crit + T.crit); st.eva = Math.min(0.6, st.eva + T.eva);
    st.critDmg += T.critDmg; st.int /= 1 + T.aspd; st.spd *= 1 + T.spd; st.cdr = Math.min(0.5, st.cdr + T.cdr);
    st.goldF += T.gold; st.dropF += T.drop; st.xpF += T.xp; st.eliteF += T.elite; st.thorns += Math.min(0.4, T.thorns);
    st.ls = Math.min(0.25, T.ls); st.regen = Math.min(0.02, T.regen);
    st.eff = G.effLevel(st);
    return st;
  };
  /* roubo de vida: cura uma fração do dano de cada golpe */
  const dm0 = G.dmgToMon;
  G.dmgToMon = (h, m, mult, forceCrit, o) => {
    const d = dm0(h, m, mult, forceCrit, o), st = h._st;
    if (d > 0 && st && st.ls > 0 && h.hp > 0 && h.state !== 'fallen' && h.hp < st.hp) {
      const v = d * st.ls; h.hp = Math.min(st.hp, h.hp + v);
      if (v >= 1 && Math.random() < 0.18) G.addFx({ t: 'dmg', x: h.x, y: h.y - 0.9, n: Math.round(v), c: '#7df09a', heal: 1 });
    }
    return d;
  };
  /* regeneração: um pouco de vida por segundo, dentro e fora de combate */
  const uh0 = G.updateHero;
  G.updateHero = (h, dt, mons) => {
    uh0(h, dt, mons);
    const st = h._st;
    if (st && st.regen > 0 && h.state !== 'fallen' && h.state !== 'recover' && h.hp > 0 && h.hp < st.hp) h.hp = Math.min(st.hp, h.hp + st.hp * st.regen * dt);
  };
  /* pontuação (o herói prefere a peça melhor) e preço */
  const sc0 = G.itemScore;
  G.itemScore = (it) => {
    let s = sc0(it);
    if (it.ins && it.ins.length) { const U = G.PW(G.TIER_LVL(it.tier)); for (const e of it.ins) { const d = G.INS[e[0]]; if (d) s += d.sc * U * G.insVal(it, e[0], e[1]); } }
    return s;
  };
  const pr0 = G.itemPrice;
  G.itemPrice = (it) => {
    let p = pr0(it);
    if (it.ins && it.ins.length) { let f = 1; for (const e of it.ins) f += 0.02 + 0.02 * e[1]; p = Math.round(p * f); }
    return p;
  };
  /* ================= Reforja ================= */
  /* Ferraria nível 2+: sorteia de novo todas as inscrições de uma peça. O resultado fica pendente na peça (it.rfp)
     até o jogador escolher entre Manter (descarta o novo) e Aceitar (troca). O custo sobe a cada reforja da peça. */
  G.PO_YIELD = [1, 2, 4, 7, 12, 20];             // Pó de Reforja do desmonte, por raridade
  const dy0 = G.dismantleYield;
  G.dismantleYield = (it) => {
    const out = dy0(it), n = Math.round((G.PO_YIELD[it.rar] || 0) * (1 + 0.1 * (it.tier - 1)));
    if (n > 0) out.po_reforja = n;
    return out;
  };
  G.reforgeCost = (it) => {
    const rf = Math.min(12, it.rf || 0), base = G.itemPrice({ type: it.type, tier: it.tier, rar: 0, plus: 0 });
    return { gold: Math.round(base * (0.8 + 0.25 * it.rar) * Math.pow(1.3, rf)), po: Math.ceil(Math.max(1, it.rar) * 1.5 * (1 + 0.5 * rf)) };
  };
  G.canReforge = (it) => {
    const S = G.S;
    if (!it) return { ok: false, why: '' };
    if (!G.bOk('ferraria') || G.bLvl('ferraria') < 2) return { ok: false, why: 'Requer Ferraria nível 2' };
    if (it.rar < 1) return { ok: false, why: 'Peças comuns não têm inscrições' };
    if (it.rfp) return { ok: false, why: 'Escolha entre manter ou aceitar a reforja atual', pending: 1 };
    const c = G.reforgeCost(it);
    if (S.gold < c.gold) return { ok: false, why: 'Faltam moedas', c };
    if ((S.res.po_reforja || 0) < c.po) return { ok: false, why: 'Falta Pó de Reforja', c };
    return { ok: true, c };
  };
  G.reforgeRoll = (it) => {
    const r = G.canReforge(it); if (!r.ok) return r;
    G.spend(r.c.gold, 'forja'); G.addRes('po_reforja', -r.c.po);
    it.rf = (it.rf || 0) + 1;
    it.rfp = G.rollIns(it.rar, it.tier, false);
    G.S.stats.reforged = (G.S.stats.reforged || 0) + 1;
    G.sfx('forge'); G.emit('inv');
    return r;
  };
  G.reforgeKeep = (it) => { if (!it || !it.rfp) return false; delete it.rfp; G.emit('inv'); return true; };
  G.reforgeAccept = (it) => {
    if (!it || !it.rfp) return null;
    const perfect = G.insPerfect(it.rfp);
    it.ins = it.rfp; delete it.rfp;
    if (perfect) { G.S.stats.perfect = (G.S.stats.perfect || 0) + perfect; G.log('A reforja deu uma inscrição perfeita a ' + G.itemName(it) + '!', 'good'); }
    for (const h of G.S.heroes) for (const k in h.gear) if (h.gear[k] === it) h._dirty = true;
    G.emit('inv');
    return { perfect };
  };
  /* mudança de poder da reforja pendente: ver G.reforgeDelta em 3B-clareza */
  /* ================= Garantia do Portal ================= */
  /* Cada sorteio de candidatos pago com moedas, sem nenhum Épico ou melhor, soma 1 ao contador. Com 10, o sorteio seguinte
     garante pelo menos um candidato Épico. A invocação com Núcleos já garante Raro+ e não mexe no contador. */
  G.PITY_MAX = 10;
  const sorte = () => { const S = G.S; return S.sorte || (S.sorte = { pity: 0, last: 0 }); };
  G.pity = () => sorte().pity;
  const rc0 = G.rollCandidates;
  G.rollCandidates = (kind) => {
    const out = rc0(kind);
    if (kind === 'nucleo') return out;
    const sr = sorte();
    sr.last = 0;
    if (sr.pity >= G.PITY_MAX && !out.some((c) => c.rar >= 3)) {
      const best = out.slice().sort((a, b) => b.rar - a.rar || Math.random() - 0.5)[0];
      best.rar = 3; best.traits = G.rollTraits(3);
      sr.last = 1; sr.guaranteed = (sr.guaranteed || 0) + 1;
      G.log('A Garantia do Portal trouxe um herói Épico.', 'epic');
    }
    if (out.some((c) => c.rar >= 3)) sr.pity = 0; else sr.pity++;
    return out;
  };
})();

;
