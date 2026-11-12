/* 3F-atrito: v25 — último atrito (lote 3-D): pré-requisitos da Jornada (3D.1), recuo e aviso de perigo (3D.3), peças que caem e Pergaminho de Proteção (3D.4)
   e moedas paradas (3D.5). Simulação, sem DOM. */
'use strict';
(function () {
  /* ================= 3D.1 pré-requisitos da Jornada ================= */
  /* Missões de obra ("Construa …", "Melhore …") nomeiam a construção e o nível (q.n). Se o alvo ainda não está liberado, a cadeia de
     pré-requisitos sai de G.bAvailable/G.bMax/G.cidReq (as mesmas regras de G.canUpgrade): Cidadela nível N e, abaixo dela, Nível de Reino M.
     Missões de chefe, de Fenda e de promoção têm o seu próprio pré-requisito (região fechada, Reino 5, nível do herói). Nada é caso a caso:
     a barra da Jornada, o guia e a aba Jornada leem G.questPrereq(). */
  G.questBuild = () => {
    const q = G.questCur(); if (!q || q.decree || !/^(Construa|Melhore)\b/.test(q.t)) return null;
    let id = G.BLD_IDS.find((i) => q.t.indexOf(G.BLD[i].name) >= 0) || G.BLD_IDS.find((i) => G.BLD[i].short && q.t.indexOf(G.BLD[i].short) >= 0);
    return id ? { id, lvl: q.n, name: G.BLD[id].name } : null;
  };
  G.buildPrereqs = (id, lvl) => {
    const S = G.S, out = []; let cur = id, want = lvl;
    for (let g = 0; g < 6; g++) {
      const have = G.bLvl(cur); if (have >= want) break;
      const l = have + 1, b = S.b[cur];
      if (!G.bAvailable(cur)) { const n = G.BLD[cur].cid; out.push({ k: 'bld', id: 'cidadela', lvl: n }); cur = 'cidadela'; want = n; continue; }
      if (b && b.dmg) { out.push({ k: 'repair', id: cur }); break; }
      if (cur === 'cidadela' && S.realm.lvl < G.cidReq(l)) { out.push({ k: 'realm', lvl: G.cidReq(l) }); break; }
      if (cur !== 'cidadela' && l > G.bMax(cur)) { const n = l - 2; out.push({ k: 'bld', id: 'cidadela', lvl: n }); cur = 'cidadela'; want = n; continue; }
      break;
    }
    return out;
  };
  /* promoção: o herói mais perto do rank pedido e o que ainda lhe falta (Guilda e nível; moedas e emblema são "faltam materiais") */
  G.promoPrereqs = (rank) => {
    let best = null;
    for (const h of G.S.heroes) if (h.rank === rank - 1 && (!best || h.lvl > best.lvl)) best = h;
    if (!best) return [];
    const q = G.promoReq(best), out = [];
    if (G.bLvl('guilda') < q.guilda) out.push({ k: 'bld', id: 'guilda', lvl: q.guilda });
    if (best.lvl < q.lvl) out.push({ k: 'hlvl', lvl: q.lvl, have: best.lvl, name: best.name });
    return out;
  };
  const stepTxt = (p) => p.k === 'bld' ? G.BLD[p.id].short + ' nível ' + p.lvl : p.k === 'realm' ? 'Nível de Reino ' + p.lvl : p.k === 'hlvl' ? 'um herói no nível ' + p.lvl : 'consertar ' + G.BLD[p.id].short;
  G.preStepTxt = stepTxt;
  /* { goal, steps: [do mais próximo ao mais distante], txt } ou null quando nada impede o passo atual (só faltam moedas e materiais) */
  G.questPrereq = () => {
    const q = G.questCur(); if (!q || q.done || q.decree) return null;
    let steps = [], goal = null;
    const b = G.questBuild();
    if (b) { goal = b.name; steps = G.buildPrereqs(b.id, b.lvl); }
    else {
      const z = G.ZONES.find((zz) => q.t.indexOf(G.MON[zz.boss].name) >= 0);
      if (z) { if (!G.zoneUnlocked(z)) { goal = G.MON[z.boss].name; steps = [{ k: 'realm', lvl: z.unlock }]; } }
      else if (/Fenda Infinita/.test(q.t)) { if (!G.riftOpen()) { goal = 'a Fenda Infinita'; steps = [{ k: 'realm', lvl: 5 }]; } }
      else { const m = /^Promova .* Rank (\w+)$/.exec(q.t), r = m ? G.RANKS.indexOf(m[1]) : -1; if (r > 0) { goal = 'Rank ' + m[1]; steps = G.promoPrereqs(r); } }
    }
    if (!steps.length) return null;
    const first = steps[0], root = steps[steps.length - 1];
    return { goal, steps, first, root, txt: 'Antes: ' + stepTxt(first) + (steps.length > 1 ? ' · ' + (root.k === 'realm' ? 'Reino ' + root.lvl : stepTxt(root)) : '') };
  };

  /* ================= 3D.3 quedas raras e dramáticas ================= */
  /* Diagnóstico (10 sementes × 180 min, base v24: 12–62 quedas por semente, média 29): ~2/3 das quedas eram contra CHEFES (Ancião e Lich),
     ~1/3 dos heróis caídos estava SEM poção e quase metade das quedas aconteceu depois de beber (a poção tinha 9 s de recarga e o herói só
     fugia abaixo de 60% do limite) ou durante a fuga. As zonas escolhidas não eram fortes demais (a zona ficava quase sempre abaixo do
     nível efetivo do herói) e a Maré quase não pesou. Ajustes, todos em G.DANGER:
       • recuo mais cedo diante de chefe (+boss) e de elite (+elite) e sem poção (+nopot), e sempre cobrindo `lead` segundos do dano recente;
       • sem poção o herói não encara chefe nem elite (a menos que seja Teimoso) e, contra chefe, só entra com `gap` de nível a mais a favor;
       • poção recarrega em `potCd` s e o herói foge ao passar de `flee`×limite com a poção em recarga. */
  G.DANGER = { on: 1, stubborn: 0.2, boss: 0.14, elite: 0.06, nopot: 0.1, lead: 3.2, tau: 3, potCd: 6, flee: 0.85, gap: 1, wait: 0.9 };
  const dmgRec = new WeakMap();
  const dh0 = G.dmgToHero;
  G.dmgToHero = (m, h, mult) => {
    const hp0 = h.hp, r = dh0(m, h, mult), d = hp0 - h.hp;
    if (d > 0) { const t = G.S.t, o = dmgRec.get(h); dmgRec.set(h, { a: (o ? o.a * Math.exp(-(t - o.t) / G.DANGER.tau) : 0) + d, t }); }
    return r;
  };
  /* dano por segundo que o herói vem levando (média móvel de G.DANGER.tau segundos) */
  G.recentDps = (h) => { const o = dmgRec.get(h); return o ? o.a * Math.exp(-(G.S.t - o.t) / G.DANGER.tau) / G.DANGER.tau : 0; };
  /* limite de vida (fração) abaixo do qual o herói bebe ou recua */
  G.retreatThr = (h, st, m) => {
    let thr = G.clamp(G.CAUTION[h.caution].thr + G.traitSum(h, 'retreat'), 0.08, 0.7);
    const f = G.DANGER; if (!f.on) return thr;
    if (m && !m.dead) thr += m.boss ? f.boss : m.elite ? f.elite : 0;
    if (h.potions <= 0) thr += f.nopot;
    if (m && m.boss && G.hasTrait(h, 'teimoso')) thr = Math.min(thr, f.stubborn);   // o Teimoso aguenta mais, mas não até a morte
    thr = Math.max(thr, Math.min(0.6, G.recentDps(h) * f.lead / st.hp + 0.05));
    return G.clamp(thr, 0.08, 0.7);
  };
  /* true = arriscado demais para este herói agora (G.findTarget pula o alvo) */
  G.engageRisk = (h, m, st) => {
    const f = G.DANGER; if (!f.on || !(m.boss || m.elite)) return false;
    if (h.potions <= 0 && (m.boss || h.hp < st.hp * f.wait)) return true;
    if (m.boss && !m.rift && m.lvl + G.diffCur().shift > st.eff + f.gap + (G.hasTrait(h, 'teimoso') ? 3 : 0)) { let al = 0; for (const a of G.S.heroes) if (a !== h && a.tgt === m && a.hp > G.heroStats(a).hp * 0.5) al++; if (al < 2) return true; }
    return false;
  };

  /* aviso de "herói em perigo": a vida cai abaixo de G.DANGER.alert, sem poção para beber e com golpes recentes. Um aviso por perigo: só
     rearma quando a vida passa de 60% ou o herói sai da luta. Evento 'danger' → { h, frac, boss }; conta em S.stats.dangers. */
  G.DANGER.alert = 0.3;
  const dangerFlag = new WeakMap(), dangerAt = new WeakMap();
  let dangerAny = -999;
  const FIGHT = { hunt: 1, flee: 1, travel: 1, defend: 1, rift: 1, inc: 1, return: 1 };
  const uh0 = G.updateHero;
  G.updateHero = (h, dt, mons) => {
    uh0(h, dt, mons);
    const S = G.S;
    if (!FIGHT[h.state]) { if (dangerFlag.has(h)) dangerFlag.delete(h); return; }
    const on = dangerFlag.get(h);
    if (!on && S.t - h.lastHit < 3 && h.potions <= 0 && h.hp > 0) {
      const st = G.heroStats(h), frac = h.hp / st.hp;
      if (frac < G.DANGER.alert && S.t - dangerAny > 20 && S.t - (dangerAt.get(h) || -999) > 60) {   // no máximo um aviso a cada 20 s no reino e um por herói a cada 60 s
        dangerFlag.set(h, 1); dangerAt.set(h, S.t); dangerAny = S.t; S.stats.dangers = (S.stats.dangers || 0) + 1;
        let boss = false; for (const o of mons) if (!o.dead && o.tgt === h && o.boss) { boss = true; break; }
        G.emit('danger', { h, frac, boss });
      }
    } else if (on && h.hp > G.heroStats(h).hp * 0.6) dangerFlag.delete(h);
  };

  /* ================= 3D.4 peças que caem e Pergaminho de Proteção ================= */
  /* Elites (chance baixa) e chefes (chance maior) às vezes deixam uma PEÇA INSCRITA no chão (G.pieces, não salva, como o espólio de
     G.drops). O toque a leva ao Armazém, com a cerimônia de G.revealForge só para Épico+; ninguém pegou em G.PIECE.life s: o herói que
     abateu leva a peça ao Armazém (nada se perde). A peça sai de G.rollGift (inscrições de G.rollIns). */
  G.PIECE = { elite: 0.035, boss: 0.28, life: 150, blink: 12, rE: [[1, 58], [2, 32], [3, 9], [4, 1]], rB: [[2, 56], [3, 32], [4, 11], [5, 1]] };
  G.pieces = [];
  let pieceN = 0;
  G.pieceAdd = (x, y, spec, by) => {
    const p0 = G.W.nearestWalk(x + G.rnd(-0.5, 0.5), y + G.rnd(-0.3, 0.3));
    const p = { id: ++pieceN, x: p0[0], y: p0[1], spec, rar: spec.rar, t: G.S.t, by: by || 0 };
    G.pieces.push(p); if (G.pieces.length > 12) G.pieces.shift();
    G.addFx({ t: 'sparks', x: p.x, y: p.y }); G.emit('piece', { t: 'drop', p });
    const rf = G.RAR[spec.rar].replace(/o$/, 'a');          // Raro → Rara, Lendário → Lendária
    if (spec.rar >= 2) G.log('Uma peça ' + rf + ' (' + G.GEAR[spec.type].name + ') caiu no chão. Toque nela para pegar.', spec.rar >= 3 ? 'epic' : 'good');
    if (spec.rar >= 3) G.toast('Uma peça ' + rf + ' caiu no chão!', 'epic', 'hammer');
    return p;
  };
  /* o jogador (ou o prazo) leva a peça: devolve o item no Armazém */
  G.pieceTake = (p, auto) => {
    const i = G.pieces.indexOf(p); if (i < 0) return null;
    G.pieces.splice(i, 1);
    const it = G.giveItem(p.spec, !!auto);
    if (auto && it && it.rar >= 3) G.revealForge(it, true);
    G.S.stats.pieces = (G.S.stats.pieces || 0) + 1;
    G.sfx('pick', p.x, p.y); G.emit('piece', { t: auto ? 'auto' : 'take', p, it });
    return it;
  };
  const km0 = G.killMon;
  G.killMon = (m, h) => {
    const was = m.dead; km0(m, h);
    if (was || !m.dead || m.rift || !(m.boss || m.elite) || !G.S) return;
    const f = G.PIECE;
    if (Math.random() < (m.boss ? f.boss : f.elite)) G.pieceAdd(m.x, m.y, G.rollGift({ rar: G.wpick(m.boss ? f.rB : f.rE) }), h ? h.id : 0);
    if (m.boss && Math.random() < 0.1) { G.addRes('pergaminho', 1); G.S.stats.scrollsGot = (G.S.stats.scrollsGot || 0) + 1; G.toast('O chefe deixou um Pergaminho de Proteção!', 'good', 'scroll'); }
  };
  let pcT = 0;
  const tk0 = G.tick;
  G.tick = (dt) => {
    tk0(dt);
    if (!G.pieces.length) return;
    pcT -= dt; if (pcT > 0) return; pcT = 1;
    const t = G.S.t;
    for (const p of G.pieces.slice()) if (t - p.t > G.PIECE.life) G.pieceTake(p, true);
  };
  G.on('start', () => { G.pieces.length = 0; });

  /* Pergaminho de Proteção: recurso especial (não se vende). Hoje, numa falha do aprimoramento +N (G.upgradeItem) a peça CONTINUA no +N
     (nada regride), mas as moedas e os materiais da tentativa se perdem. Com o pergaminho ligado, uma falha devolve moedas e materiais e
     gasta o pergaminho; se der certo, ele não é gasto. Vem do Baú do dia (dias alternados), de 1 em 10 chefes e da Loja da Arena. */
  G.RES.pergaminho = { name: 'Pergaminho de Proteção', shape: 'rune', c: ['#e8d49a', '#8a6a2a', '#fff6d0'], rare: 1, sp: 1, base: 60, info: 'Liga-se no Aprimorar: se a tentativa de +N falhar, moedas e materiais voltam para você. Vem do Baú do dia, de chefes e da Loja da Arena.' };
  const up0 = G.upgradeItem;
  G.upgradeItem = (it, prot) => {
    const S = G.S;
    if (!prot || (S.res.pergaminho || 0) < 1) return up0(it);
    const c = G.upgradeCost(it), r = up0(it);
    if (r.ok && !r.win) {
      S.gold += c.gold; for (const k in c.cost) G.addRes(k, c.cost[k]);
      G.addRes('pergaminho', -1); S.stats.scrollsUsed = (S.stats.scrollsUsed || 0) + 1; r.saved = true;
    }
    return r;
  };
  const dc0 = G.dailyChest;
  G.dailyChest = () => {
    const r = dc0(); if (!r) return r;
    const n = (G.S.daily.streak % 2 === 0 ? 1 : 0) + (G.S.daily.streak % 5 === 0 ? 1 : 0);
    if (n) { G.addRes('pergaminho', n); G.S.stats.scrollsGot = (G.S.stats.scrollsGot || 0) + n; G.log('O Baú do dia trouxe ' + n + ' Pergaminho' + (n > 1 ? 's' : '') + ' de Proteção.', 'good'); }
    return r;
  };
  /* Loja da Arena (fileira em moedas): o item entra na lista e a compra entrega o pergaminho */
  if (G.ARENA_COIN) {
    G.ARENA_COIN.push({ id: 'perg', name: 'Pergaminho de Proteção', u: 5, grow: 1.4, max: 3, icon: 'scroll', desc: 'Protege um aprimoramento +N: se falhar, moedas e materiais voltam.' });
    const cb0 = G.arenaCoinBuy;
    G.arenaCoinBuy = (id) => { const r = cb0(id); if (r.ok && id === 'perg') { G.addRes('pergaminho', 1); r.got = 'Pergaminho de Proteção'; } return r; };
  }

  /* ================= 3D.5 moedas paradas ================= */
  /* Quando o cofre passa de G.PARKED_X vezes o custo da Obra pública mais barata, a "próxima recompensa" sugere essa obra (pronta: um toque
     e as moedas viram bônus permanente; o texto fica curto para caber em 360 px). Cede lugar a calendário, contrato, conquista e promoção prontos (prioridade 5). */
  G.PARKED_X = 5;
  G.parkedWork = () => {
    const S = G.S; if (!S || !G.WORKS) return null;
    let best = null;
    for (const w of G.WORKS) { const l = G.workLvl(w.id), c = G.workCost(l); if (!best || c < best.c) best = { w, l, c }; }
    return best && S.gold > G.PARKED_X * best.c ? best : null;
  };
  const nr0 = G.nextReward;
  G.nextReward = () => {
    const r = nr0(), pk = G.parkedWork();
    if (!pk) return r;
    const o = { id: 'ob' + pk.w.id, k: 'Obra', t: pk.w.name + ' nv ' + (pk.l + 1), ic: pk.w.icon, cur: 1, n: 1, pct: 1, rk: 1, ready: true, go: 'open:reino:publicas', pr: 5 };
    const all = r.all.concat([o]), ready = all.filter((x) => x.ready).sort((a, b) => a.pr - b.pr);
    return { best: ready[0] || r.best, all };
  };

  /* @@fim3F */
})();

;
