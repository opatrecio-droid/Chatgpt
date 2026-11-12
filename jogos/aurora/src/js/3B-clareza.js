/* 3B-clareza: v24 — Poder da peça (2C.3), Códex de Inscrições (2C.4) e próxima recompensa (2C.5). Simulação, sem DOM. */
'use strict';
(function () {
  /* ================= 2C.3 Poder da peça ================= */
  /* Poder da peça = atributos-base da peça + o valor de CADA inscrição. O peso de cada inscrição (G.INS[id].pw) vem da
     elasticidade do poder do herói (raiz de dano×vida efetiva, como em G.arenaHeroPow): +1% de ataque ou de vida vale +0,5% de poder,
     +1 ponto de crítico 0,35, esquiva 0,55, roubo de vida 0,7, regeneração por segundo ~15×, espinhos 0,35; dano contra elites e chefes,
     recarga e movimento valem a fatia de combate em que agem; moedas, espólio e experiência não entram em combate e valem ~0,2–0,25.
     Tudo na mesma unidade dos atributos-base (ataque×4, vida×1 …), então somar e comparar é coerente. */
  G.insPower = (it, list) => {
    let s = 0; if (!list || !list.length) return 0;
    const U = G.PW(G.TIER_LVL(it.tier));
    for (const e of list) { const d = G.INS[e[0]]; if (d) s += (d.pw != null ? d.pw : d.sc) * U * G.insVal(it, e[0], e[1]); }
    return s;
  };
  /* atributos-base (a pontuação sem inscrições, a mesma que a IA usa) + inscrições pesadas por pw. A IA dos heróis segue em G.itemScore. */
  G.piecePower = (it) => G.itemScore(Object.assign({}, it, { ins: [] })) + G.insPower(it, it.ins);
  const rel = (a, b) => (a > 0 ? b / a - 1 : b > 0 ? 1 : 0);
  /* compara a peça a (a atual) com b (a nova): pct = poder total da peça, ins = só o conjunto de inscrições (null se nenhuma tem).
     same: a diferença é menor que 1% ("igual"). Frações: 0,12 = 12% melhor. */
  G.pieceCmp = (a, b) => {
    const pa = G.piecePower(a), pb = G.piecePower(b), pct = rel(pa, pb);
    const ia = G.insPower(a, a.ins), ib = G.insPower(b, b.ins);
    return { pa, pb, pct, ins: ia > 0 || ib > 0 ? rel(ia, ib) : null, same: Math.abs(pct) < 0.01 };
  };
  G.reforgeDelta = (it) => (it && it.rfp ? G.pieceCmp(it, Object.assign({}, it, { ins: it.rfp })).pct : 0);

  /* ================= 2C.4 Códex de Inscrições ================= */
  /* S.codex = { ins: { id: máscara de qualidades vistas (bit q, 1..5) }, gear: { tier: máscara de raridades (bit r, 0..5) },
     ms: { marco: 1 }, fresh: registros novos desde a última visita ao Códex, back: marcos que já valiam quando o Códex nasceu }.
     Registra tudo o que passa pelo Armazém e pelos heróis (forja, presentes, cartas, reforja aceita) e, ao carregar um save que
     ainda não tinha Códex, o que já existe: em silêncio, sem prêmios nem cerimônias em massa. */
  G.CODEX_TIERS = 6;                                    // linhas fixas da grade de peças; tiers acima aparecem quando surgem
  const cx = (G.codex = () => { const S = G.S; return S.codex || (S.codex = { ins: {}, gear: {}, ms: {}, fresh: 0, back: 0 }); });
  const pop = (m) => { let n = 0; for (let q = 0; q < 8; q++) if (m & (1 << q)) n++; return n; };
  G.codexStats = () => {
    const c = cx(); let slots = 0, ids = 0, perf = 0, cells = 0, tiers = 0, rm = 0, mx = -1;
    for (const id of G.INS_IDS) { const m = c.ins[id] || 0; if (m) { ids++; slots += pop(m); if (m & 32) perf++; } }
    for (let t = 1; t <= G.CODEX_TIERS; t++) { const m = c.gear[t] || 0; if (m) tiers++; cells += pop(m); }
    for (const t in c.gear) rm |= c.gear[t];
    for (let r = 0; r < 6; r++) if (rm & (1 << r)) mx = r;
    return { slots, slotsMax: G.INS_IDS.length * 5, ids, idsMax: G.INS_IDS.length, perf, cells, cellsMax: G.CODEX_TIERS * 6, tiers, rars: pop(rm), mx };
  };
  /* marcos: v(stats) >= t. rw = prêmio ({ nucleos, selos, po_reforja, gold }). big = cerimônia maior */
  G.CODEX_MS = [
    { id: 'i10',   n: 'Dez registros', d: 'Veja 10 combinações de inscrição e qualidade.', ic: 'book', t: 10, v: (s) => s.slots, rw: { po_reforja: 5 } },
    { id: 'i30',   n: 'Trinta registros', d: 'Veja 30 combinações de inscrição e qualidade.', ic: 'book', t: 30, v: (s) => s.slots, rw: { nucleos: 1, po_reforja: 10 } },
    { id: 'i60',   n: 'Sessenta registros', d: 'Veja 60 combinações de inscrição e qualidade.', ic: 'book', t: 60, v: (s) => s.slots, rw: { nucleos: 2, po_reforja: 20 } },
    { id: 'ids',   n: 'Todas as inscrições vistas', d: 'Veja cada uma das 16 inscrições, em qualquer qualidade.', ic: 'star', t: 16, v: (s) => s.ids, rw: { selos: 2, nucleos: 2, po_reforja: 15 }, big: 1 },
    { id: 'perf5', n: '5 inscrições perfeitas', d: 'Tenha 5 inscrições diferentes na qualidade Perfeita.', ic: 'spark', t: 5, v: (s) => s.perf, rw: { nucleos: 3, selos: 1 } },
    { id: 'perf16', n: 'Todas perfeitas', d: 'Tenha as 16 inscrições na qualidade Perfeita.', ic: 'crown', t: 16, v: (s) => s.perf, rw: { nucleos: 6, selos: 4 }, big: 1 },
    { id: 'i80',   n: 'Códex das Inscrições completo', d: 'Veja as 80 combinações: 16 inscrições, cada qualidade.', ic: 'trophy', t: 80, v: (s) => s.slots, rw: { nucleos: 8, selos: 5, po_reforja: 40 }, big: 1 },
    { id: 'epic',  n: 'Primeiro Épico', d: 'Tenha uma peça Épica.', ic: 'anvil', t: 1, v: (s) => (s.mx >= 3 ? 1 : 0), rw: { nucleos: 1 } },
    { id: 'leg',   n: 'Primeiro Lendário', d: 'Tenha uma peça Lendária.', ic: 'anvil', t: 1, v: (s) => (s.mx >= 4 ? 1 : 0), rw: { nucleos: 2, selos: 1 } },
    { id: 'myt',   n: 'Primeiro Mítico', d: 'Tenha uma peça Mítica.', ic: 'crown', t: 1, v: (s) => (s.mx >= 5 ? 1 : 0), rw: { nucleos: 3, selos: 2 }, big: 1 },
    { id: 'rars',  n: 'Uma peça de cada raridade', d: 'De Comum a Mítica: uma peça de cada.', ic: 'gift', t: 6, v: (s) => s.rars, rw: { nucleos: 2, po_reforja: 15 } },
    { id: 'tiers', n: 'Uma peça de cada tier', d: 'Uma peça de cada um dos 6 primeiros tiers da forja.', ic: 'anvil', t: 6, v: (s) => s.tiers, rw: { selos: 2, po_reforja: 15 } },
    { id: 'g18',   n: 'Dezoito peças no códex', d: 'Preencha 18 das 36 casas da grade de peças.', ic: 'chest', t: 18, v: (s) => s.cells, rw: { nucleos: 2, selos: 1 } },
    { id: 'g36',   n: 'Arsenal completo', d: 'Preencha as 36 casas: todo tier em toda raridade.', ic: 'trophy', t: 36, v: (s) => s.cells, rw: { nucleos: 8, selos: 5, po_reforja: 40 }, big: 1 },
  ];
  /* registra uma peça; devolve os registros novos [{ k:'i', id, q } | { k:'g', tier, rar }] */
  const noteItem = (c, it) => {
    const out = [];
    if (!it || it.tier == null || it.rar == null) return out;
    const gm = c.gear[it.tier] || 0, gb = 1 << it.rar;
    if (!(gm & gb)) { c.gear[it.tier] = gm | gb; out.push({ k: 'g', tier: it.tier, rar: it.rar }); }
    if (it.ins) for (const e of it.ins) { const m = c.ins[e[0]] || 0, b = 1 << e[1]; if (G.INS[e[0]] && !(m & b)) { c.ins[e[0]] = m | b; out.push({ k: 'i', id: e[0], q: e[1] }); } }
    return out;
  };
  G.codexCheck = (silent) => {
    const c = cx(), s = G.codexStats(), got = [];
    for (const m of G.CODEX_MS) {
      if (c.ms[m.id] || m.v(s) < m.t) continue;
      c.ms[m.id] = 1;
      if (silent) { c.back++; continue; }
      const txt = G.giveReward(m.rw, 'codex');
      G.log('Códex: "' + m.n + '". Recompensa: ' + txt + '.', 'epic'); G.sfx('quest');
      G.emit('codex', { t: 'ms', m, txt }); got.push(m);
    }
    return got;
  };
  G.codexNote = (it, silent) => {
    const c = cx(), news = noteItem(c, it);
    if (news.length) { if (!silent) { c.fresh += news.length; G.emit('codex', { t: 'new', news }); } G.codexCheck(silent); }
    return news.length;
  };
  /* varre o Armazém e os heróis (o que já existe) */
  G.codexSync = (silent) => {
    const S = G.S, c = cx(); let n = 0; const all = [];
    for (const it of S.inv) n += noteItem(c, it).length || 0;
    for (const h of S.heroes) for (const k in h.gear) if (h.gear[k]) n += noteItem(c, h.gear[k]).length || 0;
    void all;
    if (n && !silent) { c.fresh += n; G.emit('codex', { t: 'new', news: [], n }); }
    if (n || silent) G.codexCheck(silent);
    return n;
  };
  /* marco mais próximo (para a "próxima recompensa"): { m, cur, t, pct } */
  G.codexNext = () => {
    const c = cx(), s = G.codexStats(); let best = null;
    for (const m of G.CODEX_MS) { if (c.ms[m.id]) continue; const cur = Math.min(m.t, m.v(s)), pct = cur / m.t; if (!best || pct > best.pct || (pct === best.pct && m.t < best.m.t)) best = { m, cur, t: m.t, pct }; }
    return best;
  };
  /* ganchos */
  const cr0 = G.craft;
  G.craft = (type, tier, master, silent) => { const it = cr0(type, tier, master, silent); if (it) G.codexNote(it); return it; };
  const gi0 = G.giveItem;
  G.giveItem = (d, quiet) => { const it = gi0(d, quiet); if (it) G.codexNote(it); return it; };
  const ra0 = G.reforgeAccept;
  G.reforgeAccept = (it) => { const r = ra0(it); if (r && it) G.codexNote(it); return r; };
  const ng1 = G.newGame;
  G.newGame = () => { const S = ng1(); cx(); return S; };
  const al1 = G.afterLoad;
  G.afterLoad = () => { const first = !G.S.codex; al1(); G.codexSync(first); };
  let cxT = 0, cxDirty = false;
  G.on('inv', () => { cxDirty = true; });
  const tk1 = G.tick;
  G.tick = (dt) => { tk1(dt); cxT -= dt; if (cxT <= 0) { cxT = 2; if (cxDirty && G.S) { cxDirty = false; G.codexSync(false); } } };

  /* ================= 2C.5 Próxima recompensa ================= */
  /* Junta o que está mais perto de render algo: contrato do dia, conquista, promoção, marco de poder, calendário, tíquete da Arena e
     marco do Códex. Devolve { best, all }: best = o item a mostrar. Cada item: { id, k: categoria, t: texto curto, ic: ícone, cur, n, pct (barra),
     rk (para ordenar), ready (já dá para receber), go (ação data-a ao tocar), pr (prioridade entre os prontos: menor primeiro) }. */
  G.nextReward = () => {
    const S = G.S, out = [];
    let bc = null;
    for (const c of S.daily.list) {
      if (c.claimed) continue;
      const o = { id: 'ct' + c.t, k: 'Contrato', t: c.t, ic: 'scroll', cur: c.p, n: c.n, pct: Math.min(1, c.p / c.n), ready: c.p >= c.n, go: 'open:missoes:contratos', pr: 2 };
      if (o.ready) o.t = 'cumprido, receba o prêmio';
      if (!bc || o.pct > bc.pct) bc = o;
    }
    if (bc) out.push(bc);
    else if (S.daily.list.length && !S.daily.claimed) out.push({ id: 'ctbau', k: 'Contratos', t: 'baú do dia pronto', ic: 'chest', cur: 1, n: 1, pct: 1, ready: true, go: 'open:missoes:contratos', pr: 2 });
    let ba = null;
    for (const a of G.ACH) {
      const tier = G.achTier(a), got = S.ach[a.id] || 0;
      if (tier > got) { if (!ba || !ba.ready) ba = { id: 'ac' + a.id, k: 'Conquista', t: a.name, ic: 'trophy', cur: 1, n: 1, pct: 1, ready: true, go: 'open:mais:cronicas', pr: 3 }; continue; }
      if (tier >= a.tiers.length || (ba && ba.ready)) continue;
      const prev = tier ? a.tiers[tier - 1] : 0, next = a.tiers[tier], v = S.stats[a.stat] || 0, pct = Math.max(0, Math.min(1, (v - prev) / (next - prev)));
      if (!ba || pct > ba.pct) ba = { id: 'ac' + a.id + tier, k: 'Conquista', t: a.name, ic: 'trophy', cur: v, n: next, pct, ready: false, go: 'open:mais:cronicas', pr: 3 };
    }
    if (ba) out.push(ba);
    let bp = null;
    for (const h of S.heroes) {
      const q = G.promoReq(h); if (!q) continue;
      let o;
      if (G.canPromote(h)) o = { id: 'pr' + h.id, k: 'Promoção', t: h.name + ' pode subir', ic: 'up', cur: 1, n: 1, pct: 1, ready: true, go: 'herod:' + h.id, pr: 4 };
      else if (h.lvl < q.lvl) o = { id: 'pr' + h.id, k: 'Promoção', t: h.name + ' · nível ' + h.lvl + '/' + q.lvl, ic: 'up', cur: h.lvl, n: q.lvl, pct: h.lvl / q.lvl, ready: false, go: 'herod:' + h.id, pr: 4 };
      else o = { id: 'pr' + h.id, k: 'Promoção', t: h.name + ' · falta material', ic: 'up', cur: 1, n: 1, pct: 0.85, ready: false, go: 'herod:' + h.id, pr: 4 };
      if (!bp || o.ready && !bp.ready || o.ready === bp.ready && o.pct > bp.pct) bp = o;
    }
    if (bp) out.push(bp);
    if (G.nextPowerMark && S.lendas) { const m = G.nextPowerMark(); out.push({ id: 'pw' + m.i, k: 'Poder', t: 'marco de ' + G.fmt(m.v), ic: 'crown', cur: Math.round(m.from + m.pct * (m.v - m.from)), n: m.v, pct: m.pct, ready: false, go: 'open:mais:recordes', pr: 6 }); }
    const cs = G.calState && G.calState();
    if (cs && cs.ok && (S.stats.played >= 400 || (G.ret().cal.arm && S.t >= G.ret().cal.arm))) out.push({ id: 'cal', k: 'Calendário', t: 'dia ' + cs.next, ic: 'gift', cur: 1, n: 1, pct: 1, ready: true, go: 'cal', pr: 1 });
    if (G.arenaOpen && G.arenaOpen()) { const tk = G.arenaTickets(); if (tk.total > 0) out.push({ id: 'ar', k: 'Arena', t: tk.total + (tk.total > 1 ? ' tíquetes' : ' tíquete') + ' para duelar', ic: 'target', cur: tk.total, n: Math.max(tk.max, tk.total), pct: Math.min(1, tk.total / Math.max(1, tk.max)), rk: 0.8, ready: false, go: 'open:missoes:arena', pr: 7 }); }
    const cn = G.codexNext();
    if (cn) out.push({ id: 'cdx' + cn.m.id, k: 'Códex', t: cn.m.n, ic: 'book', cur: cn.cur, n: cn.t, pct: cn.pct, ready: false, go: 'open:mais:codex', pr: 8 });
    for (const o of out) if (o.rk == null) o.rk = o.pct;
    const ready = out.filter((o) => o.ready).sort((a, b) => a.pr - b.pr);
    const best = ready.length ? ready[0] : out.slice().sort((a, b) => b.rk - a.rk || a.pr - b.pr)[0] || null;
    return { best, all: out };
  };

  /* @@fim3B */
})();

;
