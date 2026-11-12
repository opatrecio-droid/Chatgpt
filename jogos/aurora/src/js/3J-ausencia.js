/* 3J-ausencia: v27 (A1) — progresso offline de verdade. Quando o jogador volta, o reino é simulado de fato pelo tempo em que esteve fora
   (G.tick, em passos de G.OFF.dt s), em fatias de tempo para a página nunca travar, com um orçamento de relógio. O que não couber no orçamento é
   estimado pelo ritmo medido na parte simulada (só moedas, recursos, experiência e abates: o calendário não é falsificado).
   Só simulação, sem DOM: a tela de espera e o resumo moram em 6I-ui-ausencia.js; o laço de quadros (fatias, visibilidade) em 90-main.js.
   Regra de velocidade: das primeiras 8 h fora conta 50% do tempo, das 8 h seguintes 30%, e nada além de 16 h (no máximo 6,4 h de jogo em 1×). */
'use strict';
(function () {
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  /* equilíbrio num só lugar */
  const OFF = (G.OFF = {
    min: 60,                    // ausências menores que isto são ignoradas (s reais)
    cap: 16 * 3600,             // teto do tempo contado (s reais)
    t1: 8 * 3600, r1: 0.5, r2: 0.3,   // primeiras 8 h a 50%, as seguintes a 30%
    dt: 0.1,                    // passo da simulação no avanço (s de jogo): rende ~1–3% menos que 0,034 (e ~1 queda a mais por hora de jogo) por cerca de metade do custo; 0,25 já perde ~5% e dobra as quedas (tools/test-offline.js --study)
    budget: 6000,               // orçamento de relógio no aparelho (ms); o restante é estimado
    slice: 30,                  // fatia por quadro (ms)
    minSim: 600,                // sempre simula ao menos isto (s de jogo) antes de estimar o resto
    lines: 5,                   // linhas notáveis no resumo
  });
  G.offlineEff = (real) => { real = G.clamp(real || 0, 0, OFF.cap); return OFF.r1 * Math.min(real, OFF.t1) + OFF.r2 * G.clamp(real - OFF.t1, 0, OFF.cap - OFF.t1); };

  /* ---------- fotografias do reino (antes, pontos de controle, depois) ---------- */
  const cum = (h) => { let c = h.xp || 0; for (let l = 1; l < h.lvl; l++) c += G.xpNeed(l); return c; };
  const snap = (done) => {
    const S = G.S, hs = {};
    for (const h of S.heroes) hs[h.id] = { lvl: h.lvl, cum: cum(h), n: h.name };
    return { done, gold: S.gold, goldIn: S.stats.goldIn, kills: S.stats.kills, res: Object.assign({}, S.res), heroes: hs };
  };

  /* ---------- decisões de rotina do avanço ---------- */
  G.offlineBegin = (real, o) => {
    const S = G.S; if (!S) return null;
    const raw = real; real = Math.min(real, OFF.cap);
    if (!(real >= OFF.min)) return null;
    o = o || {};
    const job = {
      raw, real, eff: G.offlineEff(real), dt: o.dt || OFF.dt, budget: o.budget != null ? o.budget : Infinity, slice: o.slice || OFF.slice,
      done: 0, ticks: 0, ms: 0, wall: 0, cut: false, finished: false, _last: 0, nextCp: 300,
      before: snap(0), cps: [], log: [],
      t0: S.t, day0: S.day, clock0: S.clock,
      b: { realm: S.realm.lvl, falls: S.stats.falls, crafted: S.stats.crafted, pieces: S.stats.pieces || 0, bosses: S.stats.bosses, elites: S.stats.elites, mw: S.mare.wins, ml: S.mare.losses, inv: S.inv.length, sys: Object.assign({}, (S.sys && S.sys.open) || {}), pop: S.pop || 0, happy: S.happy || 0, goldOut: S.stats.goldOut, contr: S.stats.contracts },
    };
    job.cps.push(job.before);
    /* solta quem estava numa cena da cidade e some com o visitante e a criatura da sorte: nada disso roda no avanço */
    try { if (G.scenesStop) G.scenesStop(); } catch (e) { /* ok */ }
    G.visitor = null; G.lucky = null;
    G._offEv = {}; G._offLog = (msg, kind) => { if (job.log.length < 600) job.log.push({ m: msg, k: kind }); };
    G.OFFLINE = true;
    return job;
  };

  /* roda ticks por até `ms` de relógio. Devolve true quando terminou (tudo simulado, ou orçamento esgotado e o resto será estimado) */
  G.offlineStep = (job, ms) => {
    if (job.finished) return true;
    const S = G.S, t0 = now();
    if (job._last) job.wall += Math.min(t0 - job._last, 100);       // o intervalo entre quadros conta, mas uma aba escondida não esgota o orçamento
    const lim = ms == null ? job.slice : ms;
    while (job.done < job.eff) {
      for (let i = 0; i < 48 && job.done < job.eff; i++) { const dt = Math.min(job.dt, job.eff - job.done); G.tick(dt); job.done += dt; job.ticks++; }
      if (job.done >= job.nextCp) { job.cps.push(snap(job.done)); job.nextCp *= 2; }
      if (now() - t0 >= lim) break;
    }
    const t1 = now(); job.ms += t1 - t0; job.wall += t1 - t0; job._last = t1;
    if (job.done >= job.eff - 1e-6) { job.finished = true; return true; }
    if (job.wall >= job.budget && job.done >= Math.min(job.eff, OFF.minSim)) { job.cut = true; job.finished = true; return true; }
    void S;
    return false;
  };

  /* ---------- o que não coube no orçamento: ritmo medido na segunda metade do trecho simulado ---------- */
  const pickCp = (job) => { let best = job.cps[0]; for (const c of job.cps) if (c.done <= job.done * 0.6) best = c; return best; };
  const extrapolate = (job) => {
    const S = G.S, rem = job.eff - job.done, cp = pickCp(job), span = job.done - cp.done;
    job.est = { secs: rem, span, gold: 0, kills: 0, xp: 0, res: {} };
    if (rem < 1 || span < 60) return;
    const f = rem / span, e = job.est;
    const dg = Math.round((S.gold - cp.gold) * f);
    if (dg > 0) { S.gold += dg; S.stats.goldIn += dg; } else if (dg < 0) { const l = Math.min(S.gold, -dg); S.gold -= l; S.stats.goldOut += l; }
    e.gold = dg;
    const dk = Math.round((S.stats.kills - cp.kills) * f); if (dk > 0) { S.stats.kills += dk; e.kills = dk; }
    for (const id of Object.keys(S.res)) {
      const d = ((S.res[id] || 0) - (cp.res[id] || 0)) * f; if (!d) continue;
      const cap = G.resCap(id), cur = S.res[id] || 0, nx = G.clamp(cur + d, 0, cap);
      if (nx !== cur) { S.res[id] = nx; e.res[id] = nx - cur; }
    }
    for (const h of S.heroes) {
      const c0 = cp.heroes[h.id]; if (!c0) continue;
      const dx = (cum(h) - c0.cum) * f; if (dx > 0.5) { G.xpApply(h, dx); e.xp += dx; }
    }
  };

  /* ---------- resumo do retorno ---------- */
  const grp = (s) => s.replace(/\d+/g, '#');
  const notable = (job) => {
    const by = new Map();
    for (const l of job.log) {
      if (l.k === 'boss' || l.k === 'info') continue;
      if (/ caiu diante /.test(l.m) || /^A Maré|^Aurora resistiu|^Os vigias/.test(l.m)) continue;   // quedas e Marés viram contagens
      if (/^(Herói do Dia|Novo recorde|Aurora alcançou o Nível de Reino)| caiu no chão| ganhou o título /.test(l.m)) continue;       // recheio: o resumo já traz o Nível de Reino; o resto é conversa
      const k = grp(l.m), c = by.get(k);
      if (c) c.n++; else by.set(k, { m: l.m, k: l.k, n: 1 });
    }
    const arr = [...by.values()], rank = (x) => (x.k === 'epic' ? 0 : x.k === 'bad' ? 1 : 2);
    arr.sort((a, b) => rank(a) - rank(b));
    return arr.slice(0, OFF.lines).map((x) => (x.n > 1 ? x.m + ' (×' + x.n + ')' : x.m));
  };
  const summarize = (job) => {
    const S = G.S, b = job.before, B = job.b, o = {};
    o.v = 27; o.raw = Math.round(job.raw); o.secs = Math.round(job.real); o.eff = Math.round(job.eff); o.sim = Math.round(job.done);
    o.est = job.cut ? Math.round(job.eff - job.done) : 0;
    o.day0 = job.day0; o.day1 = S.day; o.days = S.day - job.day0;
    o.gold = Math.round(S.gold - b.gold); o.goldIn = Math.round(S.stats.goldIn - b.goldIn);
    o.kills = S.stats.kills - b.kills; o.elites = S.stats.elites - B.elites; o.bosses = S.stats.bosses - B.bosses; o.falls = S.stats.falls - B.falls;
    let xp = 0, lv = 0; const up = [];
    for (const h of S.heroes) { const c0 = b.heroes[h.id]; if (!c0) continue; xp += cum(h) - c0.cum; if (h.lvl > c0.lvl) { lv += h.lvl - c0.lvl; up.push({ n: h.name, up: h.lvl - c0.lvl, lvl: h.lvl }); } }
    o.xp = Math.round(xp); o.lvls = lv; up.sort((x, y) => y.up - x.up); o.heroes = up.slice(0, 4);
    o.items = (S.stats.pieces || 0) - B.pieces + (S.stats.crafted - B.crafted); o.crafted = S.stats.crafted - B.crafted;
    o.epics = (job.ev && job.ev.reveal) || 0;
    /* recursos: o saldo de cada um, os de maior valor primeiro; "mats" = espólio dos heróis (tudo que não é da cidade) */
    const res = []; let mats = 0;
    for (const id of Object.keys(S.res)) {
      const d = Math.round((S.res[id] || 0) - (b.res[id] || 0)); if (!d || !G.RES[id]) continue;
      if (G.BASE_RES.indexOf(id) < 0 && d > 0) mats += d;
      res.push({ id, n: d, w: Math.abs(d) * (G.RES[id].base || 1) });
    }
    res.sort((x, y) => y.w - x.w); o.res = res.slice(0, 6).map((x) => ({ id: x.id, n: x.n })); o.mats = mats;
    o.realm = S.realm.lvl - B.realm; o.mw = S.mare.wins - B.mw; o.ml = S.mare.losses - B.ml;
    o.contr = S.daily.list.filter((c) => !c.claimed && c.p >= c.n).length;
    const nsys = []; if (S.sys && S.sys.open && G.SYS) for (const k in S.sys.open) if (!B.sys[k] && G.SYS[k]) nsys.push(G.SYS[k].n); o.sys = nsys.slice(0, 4);
    o.autoDec = (job.ev && job.ev.eventdone) || 0;
    o.notable = notable(job);
    o.estGold = job.est ? job.est.gold : 0; o.estKills = job.est ? job.est.kills : 0;
    return o;
  };
  /* ganchos do retorno (38-retorno: cartas; 3D-rivais: notícias): fn(o, job) acrescenta campos ao resumo */
  G.offHooks = [];

  G.offlineEnd = (job) => {
    const S = G.S;
    if (job.cut) { try { extrapolate(job); } catch (e) { if (G.DEBUG) console.error('extrapolate', e); } }
    const ev = G._offEv || {};
    G.OFFLINE = false; G._offLog = null; G._offEv = null;
    G.fx.length = 0;
    /* contratos do dia: reabre o dia atual com a lista de antes de sair (o progresso feito vale; a sequência não se perde) */
    if (S.daily && S.daily.list.length) S.daily.day = S.day;
    /* a lista de eventos pendentes não precisa de limpeza: a decisão pendente fica no HUD com o prazo que restar (3K) */
    job.ev = ev;
    const o = summarize(job);
    for (const f of G.offHooks) { try { f(o, job); } catch (e) { console.error('offHook', e); } }
    /* a interface é atualizada uma vez, com o estado final */
    for (const k of ['heroes', 'bld', 'inv', 'daily', 'quest', 'ach', 'works', 'bless', 'stable', 'decor', 'pets', 'cos']) if (ev[k]) G.emit(k);
    job.finished = true; job.summary = o;
    return o;
  };
  /* interrompe sem resumo (erro inesperado): o jogo segue com o que há */
  G.offlineAbort = () => { G.OFFLINE = false; G._offLog = null; G._offEv = null; };

  /* versão síncrona (testes e console): simula tudo, sem orçamento */
  G.offline = (real, o) => {
    const job = G.offlineBegin(real, o); if (!job) return null;
    const lim = job.budget < Infinity ? job.slice : 1e9; try { while (!G.offlineStep(job, lim)) { /* continua */ } } catch (e) { G.offlineAbort(); throw e; }
    return G.offlineEnd(job);
  };
})();

;
