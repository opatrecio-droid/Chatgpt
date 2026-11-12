/* 3D-rivais: v25 (lote 3-B) — Nêmesis e revanche (3B.1), visitantes rivais (3B.2) e laços entre heróis (3B.3). Só simulação:
   as telas e a arte ficam em 69-ui-rivais.js. Estado em S.rivais (Nêmesis, rancores, visitas) e S.lacos (pares de heróis), os dois
   com inicialização preguiçosa: saves antigos continuam valendo. Tudo entra por ganchos (wrappers) sobre a Arena (39), o retorno (38),
   os abates (3A) e o laço do jogo; os contadores são O(1) por evento e o bônus de laço passa pelo fluxo normal de atributos (_dirty). */
'use strict';
(function () {
  /* ajustes de equilíbrio num só lugar */
  G.RIVAIS = {
    nemMin: 2,                          // derrotas seguidas de rancor para o mesmo rival até ele virar Nêmesis
    nemShow: 0.55,                      // chance de o Nêmesis aparecer entre os três adversários de cada sorteio
    nemTarget: 0.5,                     // chance-alvo de vitória na revanche (um duelo justo)
    revPts: 1.5,                        // revanche: +50% de pontos
    revIns: 10, revInsPer: 2, revInsMax: 10,   // Insígnias da vingança: 10, mais 2 por derrota guardada (até +10)
    newsMin: 1800,                      // segundos fora para o retorno trazer notícias dos rivais
    newsMax: 7 * 86400,
    winPts: 22,                         // pontos médios de um duelo vencido por um rival ("venceu N duelos")
    visEvery: [360, 600],               // visitante: de 6 a 10 minutos de jogo entre uma visita e outra
    visStay: [135, 180],                // ... fica de 2 a 3 minutos de jogo
    visSpeed: 1.7,
    amTarget: 0.62,                     // duelo amistoso: chance-alvo de vitória
    amPrize: 40, amIns: 2, amInsLoss: 1,
  };
  const DAYMS = 86400000;
  const H01 = (s) => G.hash(s) / 4294967296;

  /* ================= estado ================= */
  const rDef = () => ({ v: 1, g: {}, nem: -1, vg: 0, news: 0, vis: { next: 0, n: 0, last: -1, am: 0, amN: 0, amW: 0 } });
  G.rivais = () => {
    const S = G.S, r = S.rivais || (S.rivais = {}), d = rDef();
    for (const k in d) if (r[k] === undefined) r[k] = d[k];
    return r;
  };
  const gOf = (i) => { const r = G.rivais(); return r.g[i] || (r.g[i] = { l: 0, L: 0, W: 0, sl: 0, sea: -1, t: 0 }); };
  /* "o reino" com artigo, como o jogo fala: "a Marca do Corvo Rubro", "o Clã do Lobo de Ferro" */
  const ART_R = { Baronia: 'a', Marca: 'a', Condado: 'o', Ducado: 'o', Senhorio: 'o', Reino: 'o', Ordem: 'a', 'Clã': 'o', Coroa: 'a', Protetorado: 'o', Liga: 'a', Cidadela: 'a', Irmandade: 'a', Principado: 'o', Guilda: 'a' };
  G.rivArt = (n) => (ART_R[String(n).split(' ')[0]] || 'o') + ' ' + n;
  G.rivArtDe = (n) => { const a = G.rivArt(n); return (a[0] === 'a' ? 'da ' : 'do ') + a.slice(2); };

  /* ================= 3B.1 Nêmesis ================= */
  /* o rival que mais derrotou o jogador: primeiro pelas derrotas da temporada, depois pelo rancor guardado (derrotas desde a última vingança),
     depois pelo total, depois pela mais recente. Precisa de pelo menos G.RIVAIS.nemMin derrotas de rancor. */
  G.nemesis = () => {
    const S = G.S; if (!S || !S.rivais) return null;
    const r = S.rivais, idx = G.arenaSeason().idx; let best = -1, bs = -1;
    for (const k in r.g) {
      const x = r.g[k]; if (x.l < G.RIVAIS.nemMin) continue;
      const sc = (x.sea === idx ? x.sl : 0) * 1000 + x.l * 10 + x.L * 0.1 + x.t / 1e13;
      if (sc > bs) { bs = sc; best = +k; }
    }
    if (best < 0) return null;
    const x = r.g[best];
    return { i: best, riv: G.arenaRival(best), l: x.l, L: x.L, W: x.W, sl: x.sea === idx ? x.sl : 0 };
  };
  /* falas do líder do Nêmesis. kind: 'pre' (antes do duelo), 'win' (ele venceu), 'lose' (ele perdeu), 'vingado' (a vingança foi cumprida) */
  const TAUNT = {
    pre: ['Voltou, Aurora? Trouxe equipe nova ou só coragem?', 'Eu ainda guardo o placar da última vez. Quer ver?', 'Cada duelo com vocês é um descanso para mim.', 'Venha, Aurora. A Arena tem lugar para mais uma derrota.', 'Já decorei os seus movimentos. Surpreenda-me.', 'Meu escudo tem um espaço vazio para o seu orgulho.'],
    win: ['Mais um para o meu placar. Aurora precisa de treino, ou de sorte.', 'Foi quase. É sempre quase com vocês.', 'Obrigado pela aula, Aurora. Volte quando quiser perder de novo.', 'A Arena tem memória, e ela se lembra de mim.', 'Tente outra formação. Tente outro herói. Tente outro reino.'],
    lose: ['Hoje o vento soprou para vocês. Só hoje.', 'Uma vitória não apaga tudo o que eu já ganhei de vocês.', 'Muito bem, Aurora. Da próxima vez não serei tão cortês.', 'Guardem esse sorriso. Vou querer de volta.', 'Bela luta. Anotei cada golpe. Voltaremos.'],
    vingado: ['Está feito: a conta fechou. Respeito, Aurora. Por hoje.', 'Eu perdi, e aprendi. Detesto aprender assim.', 'Levem a vitória. O rancor, eu fico com ele.', 'Que as duas luas sejam testemunhas: vocês me venceram.'],
  };
  G.nemTaunt = (i, kind) => {
    const x = G.rivais().g[i] || { L: 0, W: 0 }, l = TAUNT[kind] || TAUNT.pre;
    return l[G.hash('taunt|' + i + '|' + kind + '|' + x.L + '|' + x.W) % l.length];
  };

  /* mesma busca de ratio da Arena (calibrate é privado lá): acha a razão de poder em que a melhor equipe automática tem a chance-alvo */
  const calibTo = (i, ref, tg) => {
    const riv = G.arenaRival(i), mine = G.arenaMyBps(G.arenaAutoTeam(riv.size)), key = 'cn|' + i + '|' + Math.round(Math.log(ref.ps[0]) * 50);
    const at = (r) => G.arenaChance(mine, G.arenaRivalBps(G.arenaRealize(i, r, ref)), key, 8);
    let lo = 0.70, hi = 1.40; const cl = at(lo), ch = at(hi);
    if (cl <= tg) return { ratio: lo, ch: cl };
    if (ch >= tg) return { ratio: hi, ch };
    let best = { ratio: (lo + hi) / 2, ch: -9 };
    for (let k = 0; k < 4; k++) {
      const mid = (lo + hi) / 2, c = at(mid);
      if (Math.abs(c - tg) <= Math.abs(best.ch - tg)) best = { ratio: mid, ch: c };
      if (c >= tg) lo = mid; else hi = mid;
    }
    return best;
  };

  /* ---- os adversários do momento: o Nêmesis aparece de vez em quando (num passo à parte, como os outros três) ---- */
  const nemWanted = (off) => {
    const nem = G.nemesis(); if (!nem) return null;
    if (nem.riv.size > G.arenaRef().count) return null;
    if (off.l.some((x) => x.i === nem.i)) return nem;
    return H01('nemoff|' + off.k) < G.RIVAIS.nemShow ? nem : null;
  };
  const injectNem = (off, nem) => {
    let e = off.l.find((x) => x.i === nem.i);
    if (!e) {
      const ref = G.arenaRef(), r = calibTo(nem.i, ref, G.RIVAIS.nemTarget), ratio = Math.round(r.ratio * 1000) / 1000;
      const pv = G.arenaPreview(nem.i, G.arenaAutoTeam(nem.riv.size), ratio);
      e = { i: nem.i, ratio, ch: Math.round(pv.chance * 100) / 100 };
      let bi = 0; off.l.forEach((x, k) => { if (Math.abs(x.ch - e.ch) < Math.abs(off.l[bi].ch - e.ch)) bi = k; });
      off.l[bi] = e;
    }
    e.rev = 1;
    off.l.sort((x, y) => y.ch - x.ch);
  };
  const os0 = G.arenaOffersStep, or0 = G.arenaOffersReady, ao0 = G.arenaOffers, wp0 = G.arenaWinPts;
  G.arenaOffersStep = () => {
    if (!os0()) return false;
    const off = G.arena().off; if (!off || off.nv) return true;
    const nem = nemWanted(off);
    if (!nem) { off.nv = 1; return true; }
    if (!off.np) { off.np = 1; return false; }                    // a calibração da revanche fica para o passo seguinte
    injectNem(off, nem); off.nv = 1; return true;
  };
  G.arenaOffersReady = () => { if (!or0()) return false; const o = G.arena().off; return !!(o && o.nv); };
  G.arenaWinPts = (ch, rev) => Math.round(wp0(ch) * (rev ? G.RIVAIS.revPts : 1));
  G.arenaOffers = () => {
    const l = ao0(), a = G.arena(), src = a.off && a.off.l;
    return l.map((o, k) => { const s = src && src[k]; if (s && s.rev) { o.rev = 1; o.pts = G.arenaWinPts(o.ch, true); } return o; });
  };

  /* ---- o duelo: guarda o rancor, paga a vingança e anuncia o Nêmesis ---- */
  const ad0 = G.arenaDuel;
  G.arenaDuel = (o) => {
    const ok = G.arenaOpen() && G.S.heroes.length >= 3 && G.arenaTickets().total >= 1, offs = ok ? G.arenaOffers() : [], of = offs[o && o.off != null ? o.off : 1];
    const rev = !!(of && of.rev), nem0 = G.nemesis();
    const res = ad0(o);
    if (!res || res.err) return res;
    const S = G.S, r = G.rivais(), idx = G.arenaSeason().idx, ri = res.rival.i, x = gOf(ri), l0 = x.l;
    if (res.win) { x.W++; if (!rev) x.l = Math.max(0, x.l - 1); }
    else { x.l++; x.L++; if (x.sea !== idx) { x.sea = idx; x.sl = 0; } x.sl++; x.t = G.arenaNow(); }
    res.nemesis = !!(nem0 && nem0.i === ri);
    if (rev) {
      res.rev = { on: 1, ins: 0, vingado: false };
      if (res.win) {
        const ins = G.RIVAIS.revIns + Math.min(G.RIVAIS.revInsMax, G.RIVAIS.revInsPer * l0);
        G.arena().ins += ins; x.l = 0; r.vg++; res.rev.ins = ins; res.rev.vingado = true;
        for (const id of res.ids) { const h = S.heroes.find((q) => q.id === id); if (!h) continue; if (G.titleGrant) G.titleGrant(h, 'vingador'); if (G.heroMark) G.heroMark(h, 'venceu a revanche contra ' + G.rivArt(res.rival.name)); }
        G.log('Revanche! Aurora venceu ' + G.rivArt(res.rival.name) + ' e se vingou (+' + ins + ' Insígnias).', 'epic');
        G.emit('nemesis', { t: 'vingado', i: ri, ins });
      }
    }
    const nem1 = G.nemesis();
    if (nem1 && (!nem0 || nem0.i !== nem1.i) && !res.win) {
      G.log(cap1(G.rivArt(nem1.riv.name)) + ' é o seu Nêmesis: ' + nem1.l + ' derrotas guardadas.', 'bad');
      G.emit('nemesis', { t: 'novo', i: nem1.i, l: nem1.l });
    }
    r.nem = nem1 ? nem1.i : -1;
    res.nemNew = !!(nem1 && nem1.i === ri && !res.win && (!nem0 || nem0.i !== nem1.i));
    res.taunt = res.nemesis || (nem1 && nem1.i === ri) ? G.nemTaunt(ri, res.win ? (rev ? 'vingado' : 'lose') : 'win') : '';
    return res;
  };

  /* ---- notícias dos rivais para o retorno ("Enquanto você esteve fora…"), tudo pelo relógio da Arena ---- */
  const seaAt = (ms) => {
    const dn = G.dayNum(ms), idx = Math.floor((dn + 3) / 7), dow = (dn + 3) % 7, d0 = new Date(ms); d0.setHours(0, 0, 0, 0);
    return { idx, dow, dn, dis: dow + G.clamp((ms - d0.getTime()) / DAYMS, 0, 1) };
  };
  const ord = (n) => n + 'ª';
  const cap1 = (s) => s.replace(/^./, (c) => c.toUpperCase());
  G.rivaisNews = (secs) => {
    const S = G.S, a = S && S.arena; if (!a || !a.open || !(secs >= G.RIVAIS.newsMin)) return null;
    const now = G.arenaNow(), then = now - Math.min(secs, G.RIVAIS.newsMax) * 1000, sn = seaAt(now), st = seaAt(then), same = sn.idx === st.idx;
    const lines = [], posOf = (std, i) => std.list.find((x) => x.i === i).pos;
    let meLine = '';
    if (same) {
      const s0 = G.arenaStanding({ idx: st.idx, dis: st.dis }, a.pts), s1 = G.arenaStanding({ idx: sn.idx, dis: sn.dis }, a.pts);
      let best = null;
      for (const r of G.ARENA_RIVALS) { const up = posOf(s0, r.i) - posOf(s1, r.i); if (up >= 1 && (!best || up > best.up || (up === best.up && posOf(s1, r.i) < posOf(s1, best.i)))) best = { i: r.i, up }; }
      if (best) lines.push(cap1(G.rivArt(G.arenaRival(best.i).name)) + ' subiu ' + best.up + (best.up === 1 ? ' posição' : ' posições') + ' na tabela.');
      const m0 = s0.me, m1 = s1.me;
      if (m1 > m0) meLine = 'Você caiu da ' + ord(m0) + ' para a ' + ord(m1) + ' posição.';
    } else lines.push('A temporada virou enquanto você esteve fora.');
    const nem = G.nemesis();
    if (nem) {
      const pts = G.arenaRivalPts(nem.i, sn.idx, sn.dis) - (same ? G.arenaRivalPts(nem.i, st.idx, st.dis) : 0), w = Math.max(0, Math.round(pts / G.RIVAIS.winPts));
      if (w >= 1) lines.push('Seu Nêmesis, ' + G.rivArt(nem.riv.name) + ', venceu ' + w + (w === 1 ? ' duelo.' : ' duelos.'));
    }
    if (same && meLine) lines.push(meLine);
    return lines.length ? { lines, at: Math.round(now) } : null;
  };
  const of0 = G.offline;
  G.offline = (secs) => {
    const o = of0(secs); if (!o) return o;
    try { const n = G.rivaisNews(secs); if (n) { o.news = n; const off = G.ret && G.ret().off; if (off) off.news = n; } } catch (e) { if (G.DEBUG) console.error('news', e); }
    return o;
  };

  /* ================= 3B.3 laços entre heróis ================= */
  G.LACOS = {
    lv: [8, 50, 160],                         // pontos para Conhecidos, Companheiros (ou Rivais Amistosos) e Irmãos de Armas
    cap: { k: 9, d: 6, r: 10, b: 9 },         // limite por dia (de 5 min de jogo) e por par: caçada, duelo, resgate, chefe
    near: [5.5, 8.5],                         // "perto": entra a 5,5 casas e só sai a 8,5 (evita piscar)
    bonus: [null, null, { atk: 0.01, def: 0.01 }, { atk: 0.02, def: 0.02, mood: 0.03 }],       // por laço próximo, a partir do nível 2
    bonusOpp: [null, null, { atk: 0.02 }, { atk: 0.03, mood: 0.02 }],                          // rivais amistosos: só ataque e ânimo
    max: { atk: 0.03, def: 0.03, mood: 0.04 },                                                   // teto por herói, somando todos os laços
  };
  G.LACO_NAMES = ['', 'Conhecidos', 'Companheiros', 'Irmãos de Armas'];
  G.LACO_NAMES_OPP = ['', 'Conhecidos', 'Rivais Amistosos', 'Rivais Inseparáveis'];
  const OPP = [['corajoso', 'medroso'], ['ambicioso', 'preguicoso'], ['impulsivo', 'focado']];
  const isOpp = (a, b) => { for (const o of OPP) if ((a.traits.indexOf(o[0]) >= 0 && b.traits.indexOf(o[1]) >= 0) || (a.traits.indexOf(o[1]) >= 0 && b.traits.indexOf(o[0]) >= 0)) return true; return false; };
  G.lacoOpp = isOpp;
  const lacos = () => { const S = G.S, L = S.lacos || (S.lacos = { v: 1, p: {} }); if (!L.p) L.p = {}; return L; };
  const pk = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
  const heroOf = (id) => G.S.heroes.find((h) => h.id === id);
  const lvOf = (v) => { const T = G.LACOS.lv; return v >= T[2] ? 3 : v >= T[1] ? 2 : v >= T[0] ? 1 : 0; };
  G.lacoName = (lv, opp) => (opp ? G.LACO_NAMES_OPP : G.LACO_NAMES)[lv] || '';
  const alive = (h) => !!h && !h.inside && h.state !== 'fallen' && h.state !== 'recover';

  /* laço entre dois heróis: { v, lv, opp, name, next (pontos do próximo nível), pct } ou null */
  G.laco = (a, b) => {
    const L = G.S.lacos, p = L && L.p[pk(a.id, b.id)]; if (!p) return null;
    const opp = isOpp(a, b), T = G.LACOS.lv, lo = p.lv ? T[p.lv - 1] : 0, hi = p.lv >= 3 ? T[2] : T[p.lv];
    return { v: Math.floor(p.v), lv: p.lv, opp, name: G.lacoName(p.lv, opp), next: p.lv >= 3 ? 0 : hi, pct: p.lv >= 3 ? 100 : Math.floor(100 * (p.v - lo) / (hi - lo)), near: !!p.nr };
  };
  /* os laços de um herói, do mais forte ao mais fraco */
  G.lacosOf = (h) => {
    const L = G.S.lacos, out = []; if (!L) return out;
    for (const k in L.p) {
      const p = L.p[k]; if (p.lv < 1 || (p.a !== h.id && p.b !== h.id)) continue;
      const o = heroOf(p.a === h.id ? p.b : p.a); if (!o) continue;
      out.push(Object.assign({ h: o }, G.laco(h, o)));
    }
    return out.sort((x, y) => y.lv - x.lv || y.v - x.v);
  };
  G.lacoStats = () => {
    const L = G.S.lacos, c = [0, 0, 0, 0]; if (!L) return { n: 0, c };
    let n = 0; for (const k in L.p) { const p = L.p[k]; if (p.lv >= 1 && heroOf(p.a) && heroOf(p.b)) { c[p.lv]++; n++; } }
    return { n, c };
  };
  /* bônus atual (por herói), só para exibir: { atk, def, mood } */
  G.lacoBonus = (h) => h._lcb || { atk: 0, def: 0, mood: 0 };

  let toastAt = -99;
  const levelUp = (a, b, p, lv) => {
    const S = G.S, opp = isOpp(a, b), nm = G.lacoName(lv, opp); p.lv = lv;
    const txt = (o) => 'formou o laço «' + nm + '» com ' + o.name;
    if (G.heroMark) { G.heroMark(a, txt(b)); G.heroMark(b, txt(a)); }
    G.log(a.name + ' e ' + b.name + ' agora são ' + nm + '.', lv >= 2 ? 'good' : 'info');
    if (lv >= 2 && S.t - toastAt > 15) { toastAt = S.t; G.toast(a.name + ' e ' + b.name + ': ' + nm + '!', 'good', 'heart'); }
    if (lv === 3 && !opp && G.titleGrant) { G.titleGrant(a, 'irmao'); G.titleGrant(b, 'irmao'); }
    G.sfx(lv >= 2 ? 'laco' : 'click');
    const L = lacos(); if (!L.hint && lv >= 2) { L.hint = 1; G.toast('Heróis › Feitos: veja os laços de cada herói.', 'info', 'heart'); }
    S.stats.lacos = (S.stats.lacos || 0) + (lv === 1 ? 1 : 0);
    a._dirty = b._dirty = true;
    G.emit('laco', { a, b, lv, opp });
  };
  const bondAdd = (a, b, pts, kind) => {
    if (!a || !b || a === b || !(pts > 0)) return 0;
    if (G.S.stats.played < 240) return 0;                                  // nos primeiros 4 minutos (a apresentação do jogo) ninguém forma laços
    const L = lacos(), key = pk(a.id, b.id), day = G.S.day, cap = G.LACOS.cap[kind] || 99;
    let p = L.p[key]; if (!p) p = L.p[key] = { a: Math.min(a.id, b.id), b: Math.max(a.id, b.id), v: 0, lv: 0, d: day, c: {} };
    if (p.d !== day) { p.d = day; p.c = {}; }
    const used = p.c[kind] || 0; if (used >= cap) return 0;
    pts = Math.min(pts, cap - used); p.c[kind] = used + pts; p.v += pts;
    const lv = lvOf(p.v); if (lv > p.lv) levelUp(a, b, p, lv);
    return pts;
  };
  G.lacoAdd = bondAdd;

  /* falas dos laços (só com tela; nada de balões no simulador) */
  const LB = {
    1: ['Prazer em caçar com você, {p}.', 'Você luta bem, {p}.', 'Vou ficar por aqui, {p}.', 'Boa caçada, {p}.'],
    2: ['Cuidado aí, {p}!', 'Cobre meu flanco, {p}!', 'Boa, {p}!', 'Juntos, {p}!', 'Estou de olho em você, {p}.'],
    3: ['Até o fim, {p}.', 'Nossa dupla não perde, {p}!', 'Eu seguro a frente, {p}. Vai!', 'Lado a lado, {p}.', 'Você nunca caça sozinho, {p}.'],
    o2: ['Estou na frente, {p}!', 'Duvido que me alcance, {p}.', 'Conta aí, {p}: quantos foram?', 'Hoje eu venço, {p}.'],
    o3: ['Sem você, {p}, eu não tinha graça.', 'Empate de novo, {p}. Irritante.', 'Me alcança, {p}!', 'Rival é quem sabe do que eu sou capaz, {p}.'],
  };
  const say = (h, txt, sec) => { if (G.HEADLESS || !h || h.sayT > 0) return false; h.say = txt; h.sayT = sec || 3.2; return true; };
  let barkAt = 0;
  const pairBark = (a, b, p) => {
    const S = G.S, opp = isOpp(a, b), pool = LB[(opp && p.lv >= 2 ? 'o' : '') + p.lv]; if (!pool) return false;
    const x = Math.random() < 0.5 ? a : b, y = x === a ? b : a;
    if (!say(x, pool[Math.floor(Math.random() * pool.length)].replace('{p}', y.name))) return false;
    barkAt = S.t + 9; p.bk = S.t + 45; return true;
  };
  /* resgate: o salvador avisa e o salvo agradece */
  const rescueBark = (a, b) => { if (G.HEADLESS) return; say(a, 'Cuidado aí, ' + b.name + '!', 2.6); setTimeout(() => say(b, 'Valeu, ' + a.name + '! Te devo uma.', 3), 900); };

  /* a cada 2 s: quem está perto de um laço (histerese), bônus pelo fluxo de atributos e uma fala de vez em quando */
  let bT = 0, zT = 0;
  const bondTick = () => {
    const S = G.S, L = S.lacos; if (!L) return;
    const want = {}, cfg = G.LACOS; let talked = false;
    for (const k in L.p) {
      const p = L.p[k]; if (p.lv < 1) continue;
      const a = heroOf(p.a), b = heroOf(p.b);
      if (!a || !b) { delete L.p[k]; continue; }
      const ok = alive(a) && alive(b), d = ok ? Math.hypot(a.x - b.x, a.y - b.y) : 99;
      p.nr = ok && d < (p.nr ? cfg.near[1] : cfg.near[0]);
      if (!p.nr) continue;
      if (p.lv >= 2) {
        const B = (isOpp(a, b) ? cfg.bonusOpp : cfg.bonus)[p.lv];
        for (const h of [a, b]) { const w = want[h.id] || (want[h.id] = { atk: 0, def: 0, mood: 0 }); w.atk += B.atk || 0; w.def += B.def || 0; w.mood += B.mood || 0; }
      }
      if (!talked && !G.HEADLESS && S.t >= barkAt && S.t >= (p.bk || 0) && Math.random() < 0.05 && pairBark(a, b, p)) talked = true;
    }
    for (const h of S.heroes) {
      const w = want[h.id], mx = cfg.max, atk = w ? Math.min(mx.atk, w.atk) : 0, def = w ? Math.min(mx.def, w.def) : 0, mood = w ? Math.min(mx.mood, w.mood) : 0;
      const key = Math.round(atk * 1000) + '|' + Math.round(def * 1000) + '|' + Math.round(mood * 1000);
      if ((h._lck || '0|0|0') !== key) { h._lck = key; h._lcb = atk || def || mood ? { atk, def, mood } : null; h._dirty = true; }
    }
  };
  /* heróis caçando na mesma zona, perto uns dos outros, vão se conhecendo (a cada 4 s) */
  const zoneTick = () => {
    const by = {};
    for (const h of G.S.heroes) if (h.state === 'hunt' && h.zone) (by[h.zone] || (by[h.zone] = [])).push(h);
    for (const z in by) {
      const l = by[z]; if (l.length < 2) continue;
      const m = Math.min(l.length, 6);
      for (let i = 0; i < m; i++) for (let j = i + 1; j < m; j++) if (G.dist(l[i], l[j]) < 14) bondAdd(l[i], l[j], 0.35, 'k');
    }
  };
  /* bônus de laço no fluxo normal de atributos: lido de h._lcb, que só muda dentro do bondTick (com _dirty) */
  const hb1 = G.heroBonus;
  G.heroBonus = (h) => { const b = hb1(h), c = h._lcb; if (c) { b.atk += c.atk; b.def += c.def; b.mood += c.mood; } return b; };

  /* abates: dividiu o alvo com outro herói = laço; salvou um aliado ferido = laço maior; chefe junto = laço */
  const km1 = G.killMon;
  G.killMon = (m, h) => {
    if (m.dead || !h) return km1(m, h);
    const tgt = m.tgt, hb = m.hitBy, boss = !!m.boss, elite = !!m.elite, mx = m.x, my = m.y;
    km1(m, h);
    try {
      const hs = G.S.heroes, part = [];
      for (const id in hb) { if (part.length >= 4) break; const o = hs.find((q) => q.id === +id); if (o && o.state !== 'fallen' && Math.hypot(o.x - mx, o.y - my) < 12) part.push(o); }
      if (part.length >= 2) { const w = boss ? 3 : elite ? 1.5 : 1; for (let i = 0; i < part.length; i++) for (let j = i + 1; j < part.length; j++) bondAdd(part[i], part[j], w, boss ? 'b' : 'k'); }
      if (tgt && tgt !== h && tgt.state !== 'fallen' && tgt.hp > 0 && tgt.hp < G.heroStats(tgt).hp * 0.5 && Math.hypot(h.x - tgt.x, h.y - tgt.y) < 9 && bondAdd(h, tgt, 5, 'r') > 0) rescueBark(h, tgt);
    } catch (e) { if (G.DEBUG) console.error('laco', e); }
  };
  /* quem cai: os companheiros que estavam por perto reagem */
  const hf1 = G.heroFall;
  G.heroFall = (h, m) => {
    const r = hf1(h, m);
    if (r && !G.HEADLESS && G.S.lacos) {
      for (const k in G.S.lacos.p) {
        const p = G.S.lacos.p[k]; if (p.lv < 2 || (p.a !== h.id && p.b !== h.id)) continue;
        const o = heroOf(p.a === h.id ? p.b : p.a);
        if (o && alive(o) && Math.hypot(o.x - h.x, o.y - h.y) < 8) { say(o, 'Aguenta, ' + h.name + '!', 3); break; }
      }
    }
    return r;
  };
  /* duelos na mesma equipe */
  G.on('duelo', (d) => {
    const hs = d.ids.map(heroOf).filter(Boolean);
    for (let i = 0; i < hs.length; i++) for (let j = i + 1; j < hs.length; j++) bondAdd(hs[i], hs[j], d.win ? 3 : 1, 'd');
  });

  /* ================= 3B.2 visitantes rivais (só com tela) ================= */
  G.visitor = null;
  let vn = 0;
  const V_SAY = ['Então é isto, Aurora. Cheira a pão e a ferro quente.', 'Salve, {h}! {reino} manda lembranças.', '{lider} pediu que eu visse de perto os seus campeões.', 'Passo só uma tarde. A taverna fica por onde?', 'Dizem que as duas luas daqui são mais bonitas. São.', 'Posso olhar a sua lâmina, {h}? Só olhar.', 'Na Arena eu sou cortês. Fora dela, ainda mais.', 'Boa tarde, {h}. Venho em paz, e com sede.', 'Vim conferir se os boatos sobre Aurora são verdade.', 'O brasão de vocês é bonito. O nosso é melhor, mas o de vocês tem estilo.'];
  const V_SAY_NEM = ['Olá, {h}. Lembra de mim? A Arena lembra.', '{lider} mandou um abraço. Um abraço de quem venceu.', 'Quando quiser a revanche, {h}, é só aparecer na Arena.', 'Ainda sentindo o gosto da derrota, {h}?', 'Passei para ver como Aurora está. Sem rancor. Quase nenhum.'];
  const H_SAY = ['Aurora recebe bem quem chega em paz.', 'Se quiser medir força, a Arena está aberta.', 'A taverna é logo ali. A cerveja é boa, a conversa é melhor.', 'Diga ao seu reino que Aurora está de pé.', 'Cuidado com as duas luas: deixam todo mundo falador.', 'Gostei do brasão. Quer trocar por um nosso?'];
  const H_TRAIT = {
    corajoso: ['Quando quiser medir força, é só chamar.'], medroso: ['Oi! Eu… só olho de longe, tá?'], ambicioso: ['Um dia o meu nome estará no seu quadro de honra.'],
    preguicoso: ['Cumprimentaria direito, mas estou cansado.'], guloso: ['Vocês têm boa comida por lá? É importante.'], generoso: ['A primeira rodada na taverna é por minha conta.'],
    sociavel: ['Que alegria! Conte tudo sobre o seu reino!'], teimoso: ['Pode olhar. Mas Aurora nunca recua.'], focado: ['Anotei a sua postura. Boa guarda.'],
    notivago: ['A melhor hora para visitar é a noite. Boa escolha.'], sortudo: ['Dizem que forasteiro traz sorte. Vamos ver.'],
  };
  const H_NEM = ['Tinha que ser logo o seu reino…', 'Vai passear? Que bom. Eu fico de olho.', 'A Arena é lá. Aqui, comporte-se.'];
  const fill = (s, v, h) => { const riv = G.arenaRival(v.riv); return s.replace('{h}', h ? h.name : 'amigo').replace('{reino}', G.rivArt(riv.name)).replace('{lider}', riv.lead.title + ' ' + riv.lead.name); };
  const pickLine = (pool) => pool[Math.floor(Math.random() * pool.length)];

  /* pode visitar? só com tela, Arena aberta, tutorial feito e sem Maré */
  const visPick = () => {
    const ref = G.arenaRef(), r = G.rivais(), nem = G.nemesis(), pairs = [];
    for (const rv of G.ARENA_RIVALS) { if (rv.size > ref.count) continue; pairs.push([rv, r.vis.last === rv.i ? 0 : nem && nem.i === rv.i ? 4 : 1]); }
    return pairs.length ? G.wpick(pairs) : null;
  };
  G.visitorSpawn = (ri, k) => {
    const S = G.S, Wd = G.W, r = G.rivais(); if (G.visitor || G.HEADLESS) return null;
    const rv = ri == null ? visPick() : G.arenaRival(ri); if (!rv) return null;
    const kk = k != null ? k : Math.random() < 0.35 ? 0 : G.ri(0, rv.roster.length - 1), sp = rv.roster[kk];
    const g = G.pick(['n', 's', 'w', 'e']), o = G.GATES[g], nem = G.nemesis();
    const lvl = Math.max(4, Math.round(G.avgHeroLvl() * G.clamp(G.arenaRatio(rv.i), 0.7, 1.4)));
    const plaza = Wd.plaza, tav = G.bOk('taverna') ? Wd.door('taverna') : [Wd.fountain.x, Wd.fountain.y + 0.4], idle = G.pick(Wd.idle);
    const plan = [
      { p: [plaza.cx + G.rnd(-2.5, 2.5), plaza.cy + G.rnd(1.2, 3.2)], dwell: G.rnd(22, 30), what: 'plaza' },
      { p: [tav[0] + G.rnd(-0.8, 0.8), tav[1] + G.rnd(0.7, 1.5)], dwell: G.rnd(38, 50), what: 'taverna' },
      { p: [idle[0] + G.rnd(-0.5, 0.5), idle[1] + G.rnd(-0.4, 0.4)], dwell: G.rnd(22, 30), what: 'praça' },
    ];
    const v = { vis: 1, id: 'vis' + (++vn), riv: rv.i, k: kk, name: sp.name, fem: !!sp.fem, cls: sp.cls, rar: sp.rar, look: sp.look, lvl, rank: G.rankForLevel(lvl), gate: g, x: o.out[0], y: o.out[1], dir: o.out[0] < Wd.plaza.cx ? 1 : -1,
      state: 'walk', step: 0, plan, t: 0, life: G.rnd(G.RIVAIS.visStay[0], G.RIVAIS.visStay[1]), say: '', sayT: 0, nconv: 0, cd: 6, tk: 1, moving: false, path: null, reply: null, nem: !!(nem && nem.i === rv.i), drink: 0 };
    r.vis.n++; r.vis.last = rv.i; r.vis.next = S.t + 1e6;
    G.go(v, o.x, o.y); v.path = (v.path || []).concat(Wd.path(o.x, o.y, plan[0].p[0], plan[0].p[1]));
    G.visitor = v; S.stats.visits = (S.stats.visits || 0) + 1;
    G.log(sp.name + ', ' + (v.fem ? 'campeã ' : 'campeão ') + G.rivArtDe(rv.name) + ', visita Aurora.', 'info');
    G.emit('visitante', { t: 'chegou', v });
    return v;
  };
  const visEnd = (v) => {
    const S = G.S, r = G.rivais();
    G.visitor = null; v.gone = 1;
    r.vis.next = S.t + G.rnd(G.RIVAIS.visEvery[0], G.RIVAIS.visEvery[1]);
    G.emit('visitante', { t: 'saiu', v });
  };
  G.visitorLeave = () => { const v = G.visitor; if (!v || v.state === 'leave') return; visLeave(v); };
  const visLeave = (v) => {
    const Wd = G.W; let bg = 'n', bd = 1e9;
    for (const g in G.GATES) { const o = G.GATES[g], d = Math.hypot(o.x - v.x, o.y - v.y); if (d < bd) { bd = d; bg = g; } }
    const o = G.GATES[bg]; v.state = 'leave'; v.moving = true; v.path = Wd.path(v.x, v.y, o.x, o.y).concat(Wd.path(o.x, o.y, o.out[0], o.out[1]));
    if (v.sayT <= 0 && !G.S.mare.active && Math.random() < 0.6) { v.say = pickLine(['Foi um prazer, Aurora!', 'Até a Arena, campeões!', 'Aurora, guarde um lugar para mim.', 'Voltarei. Com mais sede.']); v.sayT = 3.2; }
  };
  /* o herói mais perto do visitante que está de bobeira na cidade */
  const heroNear = (v, rad) => {
    let best = null, bd = rad;
    for (const h of G.S.heroes) { if (h.inside || h.sayT > 0 || !(h.state === 'town' || h.state === 'idle' || h.state === 'goto')) continue; const d = Math.hypot(h.x - v.x, h.y - v.y); if (d < bd) { bd = d; best = h; } }
    return best;
  };
  const V_AIR = V_SAY.filter((x) => x.indexOf('{h}') < 0), V_AIR_NEM = V_SAY_NEM.filter((x) => x.indexOf('{h}') < 0);
  const startConv = (v, h) => {
    v.say = fill(pickLine(v.nem ? V_SAY_NEM : V_SAY), v, h); v.sayT = 3.6; v.cd = 16; v.nconv++; v.dir = h.x >= v.x ? 1 : -1; h.dir = v.x >= h.x ? 1 : -1;
    const tr = h.traits.find((t) => H_TRAIT[t]), pool = v.nem ? H_NEM : tr && Math.random() < 0.6 ? H_TRAIT[tr] : H_SAY;
    v.reply = { h, at: v.t + 2.3, line: pickLine(pool) };
  };
  const visTalk = (v) => {
    const S = G.S;
    if (v.cd > 0 || v.nconv >= 3 || v.sayT > 0 || v.reply) return;
    const h = heroNear(v, 3.4);                                             // quem passa por perto (ou foi chamado) ganha um cumprimento
    if (h) { v.call = null; return startConv(v, h); }
    if (v.call && S.t > v.callUntil) v.call = null;
    if (!v.call) {
      /* chama um herói que está de bobeira na cidade para trocar duas palavras; sem ninguém, fala para o vento */
      let best = null, bd = 12;
      for (const o of S.heroes) { if (o.inside || o.sayT > 0 || (o.state !== 'town' && o.state !== 'idle') || S.ev.curfew > S.t) continue; const d = Math.hypot(o.x - v.x, o.y - v.y); if (d < bd) { bd = d; best = o; } }
      if (best) { v.call = best; v.callUntil = S.t + 12; best.state = 'idle'; best.until = S.t + 12; G.go(best, v.x + (best.x < v.x ? -1.4 : 1.4), v.y + 0.35); v.cd = 1.5; return; }
    }
    if (Math.random() < 0.15) { const riv = G.arenaRival(v.riv); v.say = pickLine(v.nem ? V_AIR_NEM : V_AIR).replace('{reino}', G.rivArt(riv.name)).replace('{lider}', riv.lead.title + ' ' + riv.lead.name); v.sayT = 3.4; v.cd = 12; }
  };
  const visUpdate = (v, dt) => {
    const S = G.S; v.t += dt; if (v.sayT > 0) v.sayT -= dt; if (v.cd > 0) v.cd -= dt;
    if (S.mare.active && v.state !== 'leave') visLeave(v);
    if (v.reply && v.t >= v.reply.at) { const h = v.reply.h; if (h && !h.inside && h.sayT <= 0) say(h, v.reply.line, 3.4); v.reply = null; }
    switch (v.state) {
      case 'walk':
        if (G.step(v, dt, G.RIVAIS.visSpeed)) { v.state = 'stand'; v.until = v.t + v.plan[v.step].dwell; v.moving = false; if (v.plan[v.step].what === 'taverna') { v.drink = 1; if (v.sayT <= 0) { v.say = pickLine(['Uma caneca de hidromel, por favor.', 'A taverna de Aurora tem fama. Vamos ver.', 'Saúde! Às duas luas!']); v.sayT = 3.4; } } }
        break;
      case 'stand':
        v.tk -= dt; if (v.tk <= 0) { v.tk = 0.7; visTalk(v); }
        if (v.t >= v.until) {
          v.drink = 0;
          if (v.t < v.life - 20) {
            if (v.step + 1 >= v.plan.length) { const i = G.pick(G.W.idle); v.plan.push({ p: [i[0] + G.rnd(-0.6, 0.6), i[1] + G.rnd(-0.5, 0.5)], dwell: G.rnd(16, 24), what: 'praça' }); }   // ainda há tempo: mais uma volta pela praça
            v.step++; v.state = 'walk'; const p = v.plan[v.step].p; G.go(v, p[0], p[1]);
          } else visLeave(v);
        }
        break;
      case 'leave': if (G.step(v, dt, G.RIVAIS.visSpeed * 1.1)) visEnd(v); break;
      default: break;
    }
    if (v.t >= v.life + 30 && v.state !== 'leave') visLeave(v);
    if (v.t >= v.life + 90) visEnd(v);                                    // segurança: nunca fica preso
  };
  const visTick = (dt) => {
    const v = G.visitor; if (v) return visUpdate(v, dt);
    const S = G.S; if (!S.tut.done || !S.arena || !S.arena.open || S.mare.active || S.heroes.length < 3) return;
    const R = G.rivais();
    if (!R.vis.next || R.vis.next - S.t > 800) R.vis.next = S.t + G.rnd(60, 160);
    if (S.t >= R.vis.next && G.visitorView() !== false) G.visitorSpawn();
  };
  G.visitorView = () => true;                                              // a interface pode trocar por algo que sabe se o mapa está visível

  /* ---- duelo amistoso: 1× por dia do aparelho, sem tíquete, não vale pontos de liga ---- */
  G.visitorInfo = (v) => {
    v = v || G.visitor; if (!v) return null;
    const riv = G.arenaRival(v.riv), sea = G.arenaSeason(), pts = G.arenaRivalPts(v.riv, sea.idx, sea.dis), std = G.arenaStanding(sea), lg = G.arenaLeague(pts);
    const e = std.list.find((x) => x.i === v.riv), r = G.rivais(), today = G.dayNum(G.arenaNow());
    return { v, riv, pts, liga: lg, pos: e ? e.pos : 0, total: std.list.length, can: r.vis.am !== today && G.S.heroes.length >= riv.size, used: r.vis.am === today, nem: v.nem };
  };
  G.visitorDuel = () => {
    const S = G.S, v = G.visitor, r = G.rivais(), today = G.dayNum(G.arenaNow());
    if (!v) return { err: 'O visitante já foi embora.' };
    if (r.vis.am === today) return { err: 'Você já duelou com um visitante hoje.' };
    const riv = G.arenaRival(v.riv), n = riv.size;
    if (S.heroes.length < n) return { err: riv.name + ' envia ' + n + ' heróis: faltam heróis em Aurora.' };
    const ref = G.arenaRef(), team = G.arenaAutoTeam(n), mine = G.arenaMyBps(team);
    const c = calibTo(riv.i, ref, G.RIVAIS.amTarget), ratio = Math.round(c.ratio * 1000) / 1000, rz = G.arenaRealize(riv.i, ratio, ref);
    const seed = G.hash('amis|' + today + '|' + riv.i + '|' + team.map((x) => x.id).join(','));
    const sim = G.arenaSim(mine, G.arenaRivalBps(rz), seed, { rec: true }), win = sim.win;
    r.vis.am = today; r.vis.amN++; if (win) r.vis.amW++;
    const gold = win ? Math.round(G.RIVAIS.amPrize * G.PM(G.avgHeroLvl()) * (1 + 0.04 * S.realm.lvl)) : 0, ins = win ? G.RIVAIS.amIns : G.RIVAIS.amInsLoss;
    if (gold) G.prizeGive({ gold }, { quiet: true });
    G.arena().ins += ins;
    const hs = team.map((x) => heroOf(x.id)).filter(Boolean);
    for (let i = 0; i < hs.length; i++) for (let j = i + 1; j < hs.length; j++) bondAdd(hs[i], hs[j], 2, 'd');
    const mvp = sim.F.filter((f) => f.side === 0).sort((x, y) => y.dmg - x.dmg)[0];
    if (win && mvp && G.heroMark) { const h = hs.find((q) => q.name === mvp.name); if (h) G.heroMark(h, 'venceu um duelo amistoso contra ' + v.name + ' ' + G.rivArtDe(riv.name)); }
    S.stats.amDuels = (S.stats.amDuels || 0) + 1;
    G.log('Duelo amistoso com ' + v.name + ' ' + G.rivArtDe(riv.name) + ': ' + (win ? 'vitória' : 'derrota') + ' (+' + ins + (ins > 1 ? ' Insígnias' : ' Insígnia') + (gold ? ', +' + G.fmt(gold) + ' moedas' : '') + ').', win ? 'good' : 'info');
    const res = { win, friendly: 1, ids: team.map((x) => x.id), team, rival: { i: riv.i, name: riv.name, ratio, size: rz.heroes.length, ch: c.ch, label: 'Amistoso' }, rz, pts: 0, ins, gold, streak: 1, rank0: 0, rank1: 0, mvp: mvp ? { name: mvp.name, dmg: mvp.dmg, cls: mvp.cls } : null, sim, ev: sim.ev, t: sim.t, seed, visitor: v.name };
    G.emit('visitante', { t: 'duelo', res });
    return res;
  };

  /* ================= ganchos do laço do jogo ================= */
  const tk0 = G.tick;
  G.tick = (dt) => {
    tk0(dt);
    const S = G.S; if (!S) return;
    bT -= dt; if (bT <= 0) { bT = 2; bondTick(); }
    zT -= dt; if (zT <= 0) { zT = 4; zoneTick(); }
    if (!G.HEADLESS) visTick(dt);
  };
  const reset = () => {
    G.visitor = null; bT = zT = 0; barkAt = 0; toastAt = -99;
    const S = G.S; if (!S) return;
    for (const h of S.heroes) { h._lcb = null; h._lck = ''; }
    const L = S.lacos; if (L) for (const k in L.p) { const p = L.p[k]; if (!heroOf(p.a) || !heroOf(p.b)) delete L.p[k]; else p.nr = false; }
  };
  const ng2 = G.newGame; G.newGame = () => { const S = ng2(); reset(); return S; };
  const al2 = G.afterLoad; G.afterLoad = () => { al2(); reset(); };
})();

;
