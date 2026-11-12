#!/usr/bin/env node
/* Simulador headless do Aurora.
   Uso: node ferramentas/sim.js [arquivo.html] [--min=120] [--seed=1] [--quiet] [--noreforge] [--week=forja|cacada|portal|ouro|none] [--save=arquivo.json] [--cmode=0|1|2] [--cbudget=MIN] [--clab=MIN]   (v25: o robô também duela na Arena; v26: relata títulos, Herói do Dia, recordes e marcos de poder)
   Roda o jogo sem tela (G.HEADLESS) com um jogador-robô simples e imprime uma linha do tempo de
   "momentos de recompensa" e métricas de ritmo. Sai com código 1 se houver exceção na simulação. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--')) || path.join(__dirname, '..', 'aurora.html');
const opt = (k, d) => { const a = args.find((x) => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const MIN = +opt('min', 120);               // minutos reais simulados (velocidade 1×)
const SEED = +opt('seed', 1);
const QUIET = args.includes('--quiet');
const QUESTLESS = args.includes('--questless');   // robô antigo: ignora a Jornada ao construir
const WEEK = opt('week', '');                  // v24: força a semana temática (sem isso vale a semana real do relógio)
const CMODE = +opt('cmode', 1);                // v28: Colosso — 0 Livre (fração dos heróis), 1 Convocar todos (jogador ativo), 2 Dispensar
const CLAB = +opt('clab', 0);                  // v28: laboratório do Colosso — a partir deste minuto a semana fica congelada num sábado ao meio-dia (Colosso sempre desperto, orçamento padrão) para medir o tempo de abate
const CBUDGET = +opt('cbudget', CLAB ? 0 : 8);            // v28: minutos de fogo da equipe para derrubar o Colosso. O jogo usa 48 (≈65 min de luta com todos convocados), mas o robô só tem os 15 min de um fim de semana (3 dias de jogo × 5 min), então o padrão aqui é proporcional (8); --cbudget=0 usa o do jogo
const RIFT = args.includes('--rift');            // lote 3-C: o robô também faz a expedição grátis do dia na Fenda Infinita (é dela que vem a Essência para o Rank SSS)
const REFORGE = !args.includes('--noreforge');   // v23: o robô também reforja inscrições (só se o jogo tiver a função)

const html = fs.readFileSync(file, 'utf8');
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error('script não encontrado'); process.exit(2); }

// Math.random determinístico para comparações reproduzíveis
let s = SEED >>> 0; const rnd = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const mathR = Object.create(Math); mathR.random = rnd;
const errors = [];
const ctx = { console: { log() {}, warn() {}, error: (...a) => errors.push(a.join(' ')) }, Math: mathR, Date, JSON, setTimeout() {}, clearTimeout() {}, performance: { now: () => 0 } };
ctx.globalThis = ctx;
vm.createContext(ctx);
try { vm.runInContext(m[1], ctx, { filename: 'aurora.js' }); } catch (e) { console.error('ERRO ao carregar:', e.stack); process.exit(1); }
const G = ctx.G; G.DEBUG = true;
if (WEEK && 'weekForce' in G) G.weekForce = WEEK;
G.W.init && G.W.init();
if (CBUDGET && G.COLOSSO) G.COLOSSO.budgetMin = CBUDGET;
G.newGame();
const S = () => G.S;

const moments = []; const T0 = () => S().stats.played;
const mark = (k, txt) => moments.push({ t: T0(), k, txt });
G.on('realm', (d) => mark('reino', 'Nível de Reino ' + d.lvl));
G.on('promo', (h) => mark('promo', h.name + ' → rank ' + G.RANKS[h.rank]));
G.on('quest', () => mark('jornada', 'missão concluída'));
/* v26 (lote 4-A): pedidos dos moradores — cada entrega é um momento legítimo (o jogador toca e recebe) */
const ped = { novo: 0, entregue: 0, expirou: 0, falhou: 0, byM: {}, late: [] };
G.on('pedido', (d) => { ped[d.t] = (ped[d.t] || 0) + 1; const m = d.r && d.r.m; if (m) { ped.byM[m] = ped.byM[m] || { n: 0, ok: 0 }; if (d.t === 'novo') ped.byM[m].n++; if (d.t === 'entregue') ped.byM[m].ok++; } if (d.t === 'entregue') { mark('pedido', d.who + ': ' + d.title); ped.late.push(S().t - d.r.t0); } });
const origLog = G.log;
G.log = (msg, kind) => { if (kind === 'epic' || kind === 'boss') mark(kind, msg); return origLog(msg, kind); };

const stats = { reforges: 0, accepted: 0, perfect: 0 };
/* v26: Lendas — títulos desbloqueados, Herói do Dia, recordes e marcos de poder (com o minuto de cada um) */
const lendas = { titles: [], marks: [], hod: [], recs: 0, hodIds: {} };
G.on('titulo', (d) => { if (d.t) lendas.titles.push({ t: T0(), n: d.h.name, id: d.t.id }); });
G.on('pmark', (d) => { lendas.marks.push({ t: T0(), v: d.v, rw: d.rw }); });
G.on('hod', (d) => { lendas.hod.push({ t: T0(), d: d.d, n: d.name, why: d.why }); lendas.hodIds[d.id] = 1; });
G.on('recorde', () => { lendas.recs++; });
/* v27: Códex de Inscrições — minuto de cada marco */
const codexMs = [];
G.on('codex', (d) => { if (d.t === 'ms') codexMs.push({ t: T0(), id: d.m.id }); });
/* v28: Colosso da Semana — a semana é a da Arena (relógio virtual: dia de jogo = dia real, começando numa segunda). O robô convoca os heróis assim que ele desperta. */
const colo = { ss: 0, fs: 0, hs: 0, labT: 0, labDone: 0, weeks: [], marks: 0, wins: 0, wake: 0, warn: 0, chest: { n: 0, s: 0, p: 0 }, calls: 0, falls: 0, fallsHonor: 0 };
if (G.colosso) {
  G.on('colosso', (d) => {
    if (d.t === 'mark') colo.marks++;
    else if (d.t === 'win') { colo.wins++; colo.chest.n += d.chest.nucleos; colo.chest.s += d.chest.selos; colo.chest.p += d.chest.po_reforja; }
    else if (d.t === 'rank') colo.weeks.push(d.rec);
    else if (d.t === 'wake') colo.wake++; else if (d.t === 'warn') colo.warn++;
  });
}
/* v25: a Arena usa um relógio próprio (G.arenaNow). Aqui cada dia de jogo vale um dia da Arena, começando numa segunda-feira, para o robô
   duelar até 5 vezes por dia de jogo e a temporada virar a cada 7 dias de jogo (testa o fim de temporada e o baú). */
const arena = { duels: 0, wins: 0, ch: 0, leagues: [], lastSea: -1 };
/* v28 (lote 3-B): Nêmesis, revanche e laços — eventos 'nemesis' e 'laco' (só medem; o jogo decide) */
const rivs = { nem: 0, vingados: 0, revs: 0, revWins: 0, lacos: [0, 0, 0, 0], first: [0, 0, 0, 0], titles: {} };
if (G.nemesis) { const ad0 = G.arenaDuel; G.arenaDuel = (o) => { const r = ad0(o); if (r && r.rev && r.rev.on) { rivs.revs++; if (r.win) rivs.revWins++; } return r; }; }   // conta toda revanche, do robô de revanche ou do duelo do meio
/* lote 4-B: sinergias — combinações de formação nos duelos (decisivas incluídas) e do grupo no Colosso, ressonância no fim */
const syn = { duels: 0, mine: 0, rv: 0, dec: 0, decMe: 0, names: {}, col: 0, colN: 0, colNames: {} };
if (G.synFind) { const ad1 = G.arenaDuel; G.arenaDuel = (o) => { const r = ad1(o); if (r && r.syn) { syn.duels++; if (r.syn.me.length) syn.mine++; if (r.syn.rv.length) syn.rv++; for (const a of r.syn.me) syn.names[G.SYN_BY[a.id].name] = (syn.names[G.SYN_BY[a.id].name] || 0) + 1; if (r.syn.dec) { syn.dec++; if (r.syn.dec.side === 0) syn.decMe++; } } return r; }; }
G.on('nemesis', (d) => { if (d.t === 'novo') rivs.nem++; else if (d.t === 'vingado') rivs.vingados++; });
G.on('laco', (d) => { rivs.lacos[d.lv]++; if (!rivs.first[d.lv]) rivs.first[d.lv] = T0(); });
if (G.arenaNow) {
  const b0 = new Date(); b0.setHours(0, 0, 0, 0); b0.setDate(b0.getDate() - ((b0.getDay() + 6) % 7));
  let frozen = 0;
  G.arenaNow = () => {
    if (CLAB && !frozen && t >= CLAB * 60) { const d = S().day - 1, wk0 = Math.floor(d / 7) * 7; frozen = b0.getTime() + (wk0 + 5.5) * 86400000; }
    return frozen || b0.getTime() + ((S().day - 1) + S().clock / 1440) * 86400000;
  };
}
let t = 0;
/* lote 3-C: Fenda Infinita (--rift): 1 expedição grátis por dia de jogo com os 5 heróis mais fortes */
const rift = { runs: 0, wins: 0 };
if (G.on) G.on('rift', (d) => { if (d && d.win) rift.wins++; });
const riftBot = (st) => {
  if (!RIFT || !G.riftCanStart || st.rift.dayDone === st.day || !G.riftCanStart()) return;
  const team = st.heroes.filter((h) => h.state !== 'fallen' && h.state !== 'recover').sort((a, b) => G.arenaHeroPow(b) - G.arenaHeroPow(a)).slice(0, 5).map((h) => h.id);
  if (team.length < 3 || team.reduce((n, id) => n + G.heroStats(st.heroes.find((h) => h.id === id)).eff, 0) / team.length < G.riftLvl(st.rift.floor) + 3) return;   // só entra quando a equipe aguenta o andar (um jogador atento não manda todo dia para perder)
  if (G.riftStart(team)) rift.runs++;
};
let firstCan = null;
/* lote 3-C: o robô renasce, esquece traços negativos, aprende traços raros (nesta ordem de preferência) e sobe o nível dos traços com os pontos */
const reb = { n: 0, mins: [], names: [], spent: 0, rare: 0, ups: 0, forgets: 0, buys: 0 };
if (G.on) G.on('rebirth', (d) => { reb.n++; reb.mins.push(+(T0() / 60).toFixed(1)); reb.names.push(d.h.name + ' ★' + d.h.stars); mark('renascer', d.h.name + ' renasceu (★' + d.h.stars + ', +' + d.pts + ' pontos)'); });
if (G.on) G.on('altar', (d) => { reb.spent += d.cost; if (d.op === 'forget') reb.forgets++; else if (d.op === 'up') reb.ups++; else { reb.buys++; if (G.TRAITS[d.id].rare) reb.rare++; } });
const REB_PREF = ['memoria', 'imortal', 'eclipse', 'mao', 'lince', 'lunar'];
const rebBot = (h) => {
  if (!(h.stars > 0) || G.rbPts(h) <= 0) return;
  for (let guard = 0; guard < 14; guard++) {
    const neg = h.traits.find((t) => G.traitKind(t) === 'neg');
    if (neg && G.rbDo(h, 'forget', neg).ok) continue;
    const rare = REB_PREF.find((t) => h.traits.indexOf(t) < 0);
    if (rare && G.rbDo(h, 'buy', rare).ok) continue;
    const up = h.traits.slice().sort((a, b) => (G.traitKind(b) === 'rare') - (G.traitKind(a) === 'rare')).find((t) => G.rbCheck(h, 'up', t).ok);
    if (up && G.rbDo(h, 'up', up).ok) continue;
    break;
  }
};
/* ---------- jogador-robô ---------- */
let thinkT = 0;
const pieceRar = {};
const bot = () => {
  const st = S();
  try {
    if (G.colSyn && G.colossoLive && G.colossoLive() && G.colSyn.n > 0) { syn.colN++; if (G.colSyn.act.length) { syn.col++; for (const a of G.colSyn.act) syn.colNames[G.SYN_BY[a.id].name] = (syn.colNames[G.SYN_BY[a.id].name] || 0) + 1; } }
    while (G.questClaim()) {}
    st.daily.list.forEach((c, i) => G.contractClaim(i)); G.dailyChest();
    for (const a of G.ACH) G.achClaim(a.id);
    if (st.heroes.length < G.heroCap() && st.gold > G.recruitCost() * 1.3) {
      const c = G.rollCandidates('ouro').sort((a, b) => b.rar - a.rar)[0];
      if (G.spend(G.recruitCost(), 'recrutar')) G.hire(c);
    }
    for (const h of st.heroes) if (G.canPromote(h)) G.promote(h);
    if (firstCan == null && G.canRebirth && st.heroes.some((h) => G.canRebirth(h))) firstCan = +(T0() / 60).toFixed(1);
    for (const h of st.heroes) if (G.canRebirth && G.canRebirth(h)) G.rebirth(h);
    if (G.rbDo) for (const h of st.heroes) rebBot(h);
    riftBot(st);   // lote 3-C: gasta os Pontos de Renascimento no Altar
    // construir/melhorar: primeiro o que a Jornada pede (como um jogador seguindo a missão); senão, o mais barato
    const qt = (G.questCur && G.questCur().t) || '';
    const want = G.BLD_IDS.find((id) => qt.indexOf(G.BLD[id].name) >= 0 || (G.BLD[id].short && qt.indexOf(G.BLD[id].short) >= 0));
    let done = false;
    if (want && !QUESTLESS) {
      const r = G.canUpgrade(want);
      if (r.ok) done = G.upgrade(want);
      else if (/Cidadela/.test(r.why || '') && G.canUpgrade('cidadela').ok) done = G.upgrade('cidadela');
      else if (r.c) done = true;   // só falta dinheiro/material para o pedido da Jornada: junte para ele
    }
    if (!done) {
      const opts = G.BLD_IDS.map((id) => [id, G.canUpgrade(id)]).filter(([, r]) => r.ok).sort((a, b) => a[1].c.gold - b[1].c.gold);
      if (opts.length && st.gold > opts[0][1].c.gold * 1.2) G.upgrade(opts[0][0]);
    }
    for (const id of G.BLD_IDS) if (st.b[id] && st.b[id].dmg) G.repair(id);   // v26: conserta o que a Maré danificou (um jogador faria; sem isso a Hospedaria quebrada trava o reino)
    if (G.BLESS) for (const b of G.BLESS) G.buyBless(b.id);
    // forjar o que os heróis precisam (até 2 por decisão), como um jogador atento faria
    if (G.bOk('ferraria')) {
      let left = 2; const mt = G.forgeMaxTier();
      for (const h of st.heroes) for (const [slot, type] of G.heroSlots(h)) {
        if (left <= 0 || !G.gearUnlocked(type)) continue;
        const cur = h.gear[slot]; if (cur && cur.tier >= mt) continue;
        if (st.inv.some((i) => i.forSale && i.type === type && i.tier >= (cur ? cur.tier + 1 : 1))) continue;
        for (let tt = mt; tt >= 1; tt--) { if (cur && cur.tier >= tt) break; if (G.canCraft(type, tt, false).ok) { G.craft(type, tt, false, true); left--; break; } }
      }
    }
    if (REFORGE && G.reforgeRoll) reforgeBot(st);
    if (G.arenaOpen && G.nemesis) revBot(st);
    if (G.arenaOpen) arenaBot(st);
    if (G.colossoInfo) colossoBot(st);
    if (G.pedidoDeliver && G.pedidos) for (const r of G.pedidos().list.slice()) if (G.pedidoReady(r)) G.pedidoDeliver(r);   // 4-A: o robô entrega o que estiver pronto
    if (G.pieces) for (const p of G.pieces.slice()) { const it = G.pieceTake(p); if (it) pieceRar[it.rar] = (pieceRar[it.rar] || 0) + 1; }   // 3-D: o robô toca nas peças caídas
  } catch (e) { errors.push('bot: ' + e.stack); }
};
/* v28: ao despertar o Colosso, o robô escolhe o modo de convocação (padrão: Convocar todos, como um jogador ativo) uma vez por semana */
const colossoBot = (st) => {
  const ci = G.colossoInfo();
  if (ci.live && st.colosso && st.colosso.mode !== CMODE && st.colosso.cw !== st.colosso.wk) { G.colossoCall(CMODE); st.colosso.cw = st.colosso.wk; colo.calls++; }
};
/* v28 (lote 3-B): quando o Nêmesis aparece entre os adversários, o robô aceita a revanche (com a melhor equipe automática) */
const revBot = (st) => {
  if (!G.arenaOpen() || st.heroes.length < 3) return;
  G.arenaSync();
  for (let guard = 0; guard < 4 && G.arenaTickets().free > 0; guard++) {
    const of = G.arenaOffers(), k = of.findIndex((x) => x.rev); if (k < 0) break;
    const rv = G.arenaRival(of[k].i), team = G.arenaAutoTeam(rv.size);
    const r = G.arenaDuel({ ids: team.map((x) => x.id), rows: Object.fromEntries(team.map((x) => [x.id, x.r])), off: k });
    if (r.err) { errors.push('revanche: ' + r.err); break; }
    arena.duels++; if (r.win) arena.wins++; arena.ch += of[k].ch;
  }
};
/* v25: duela na Arena enquanto houver tíquete grátis do dia, sempre contra o adversário do meio, com a melhor equipe automática */
const arenaBot = (st) => {
  if (!G.arenaOpen() || st.heroes.length < 3) return;
  G.arenaSync();
  for (let guard = 0; guard < 8 && G.arenaTickets().free > 0; guard++) {
    const of = G.arenaOffers(); if (!of.length) break;
    const k = Math.floor((of.length - 1) / 2), rv = G.arenaRival(of[k].i), team = G.arenaAutoTeam(rv.size);
    const r = G.arenaDuel({ ids: team.map((x) => x.id), rows: Object.fromEntries(team.map((x) => [x.id, x.r])), off: k });
    if (r.err) { errors.push('arena: ' + r.err); break; }
    arena.duels++; if (r.win) arena.wins++; arena.ch += of[k].ch;
  }
};
/* v23: junta Pó de Reforja desmontando sobras comuns quando o armazém enche e reforja a peça equipada mais fraca;
   aceita a reforja só se o poder da peça subir (como um jogador atento faria). */
const reforgeBot = (st) => {
  if (G.bLvl('ferraria') < 2) return;
  if ((st.res.po_reforja || 0) < 20 || st.inv.length > G.invCap() * 0.55) for (const it of st.inv.slice()) {
    if (it.lock) continue;
    const kind = G.GEAR[it.type].kind;
    const wanted = st.heroes.some((h) => { const c = G.CLASSES[h.cls]; if ((kind === 'arma' && it.type !== c.w) || (kind === 'armadura' && it.type !== c.a)) return false; const cur = h.gear[kind]; return !cur || G.itemScore(it) > G.itemScore(cur) * 1.06; });
    if (!wanted) G.dismantle(it, true);   // sobra que nenhum herói usaria: vira Pó de Reforja
  }
  let left = 2;
  const pieces = [];
  for (const h of st.heroes) for (const k in h.gear) { const it = h.gear[k]; if (it && it.rar >= 2) pieces.push(it); }
  pieces.sort((a, b) => G.itemScore(a) / G.itemPrice(a) - G.itemScore(b) / G.itemPrice(b));
  for (const it of pieces) {
    if (left <= 0) break;
    const r = G.canReforge(it); if (!r.ok || st.gold < r.c.gold * 4) continue;
    G.reforgeRoll(it); left--; stats.reforges++;
    if (G.reforgeDelta(it) > 0.02) { const o = G.reforgeAccept(it); stats.accepted++; if (o && o.perfect) stats.perfect += o.perfect; } else G.reforgeKeep(it);
  }
};

/* ---------- laço ---------- */
const DT = 0.034, TOTAL = MIN * 60;
let nextBot = 0, nextSample = 0; const samples = [];
const t0 = Date.now();
while (t < TOTAL) {
  try { G.tick(DT); } catch (e) { errors.push('tick: ' + e.stack); if (errors.length > 20) break; }
  t += DT;
  if (t >= nextBot) { nextBot = t + 5; bot(); if (G.colossoLive && G.colossoLive()) { colo.ss++; colo.fs += S().heroes.filter((h) => h.state === 'colosso').length; colo.hs += S().heroes.length; if (CLAB && t >= CLAB * 60) colo.labT = colo.labT || t; } if (G.colosso && S().colosso && S().colosso.win && colo.labT && !colo.labDone) colo.labDone = t; }
  if (t >= nextSample) {
    nextSample = t + 600;
    const st = S();
    samples.push({ min: Math.round(t / 60), dia: st.day, reino: st.realm.lvl, ouro: Math.round(st.gold), herois: st.heroes.length, lvls: st.heroes.map((h) => h.lvl).join('/'), ranks: st.heroes.map((h) => G.RANKS[h.rank]).join(''), kills: st.stats.kills, missao: st.quest.step, quedas: st.stats.falls, ...(reb.n ? { estrelas: st.heroes.map((h) => h.stars || 0).join('/') } : {}) });
  }
}
const secs = (Date.now() - t0) / 1000;

/* ---------- relatório ---------- */
const byK = {}; for (const x of moments) byK[x.k] = (byK[x.k] || 0) + 1;
const gaps = []; for (let i = 1; i < moments.length; i++) gaps.push(moments[i].t - moments[i - 1].t);
gaps.sort((a, b) => a - b);
const med = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 0, max = gaps.length ? gaps[gaps.length - 1] : 0;
const first = (k) => { const x = moments.find((m) => m.k === k); return x ? (x.t / 60).toFixed(1) + ' min' : '—'; };
console.log('Aurora sim · ' + path.basename(file) + ' · ' + MIN + ' min simulados em ' + secs.toFixed(1) + ' s · semente ' + SEED + (G.week ? ' · semana ' + G.week().id : ''));
console.log('Amostras a cada 10 min:'); for (const x of samples) console.log('  ' + JSON.stringify(x));
console.log('Momentos: ' + moments.length + ' ' + JSON.stringify(byK));
console.log('Intervalo entre momentos: mediana ' + med.toFixed(0) + ' s, maior ' + max.toFixed(0) + ' s');
{ const gl = []; for (let i = 1; i < moments.length; i++) gl.push({ g: moments[i].t - moments[i - 1].t, at: moments[i - 1].t, a: moments[i - 1].k, b: moments[i].k }); gl.sort((x, y) => y.g - x.g);
  console.log('Maiores vazios: ' + gl.slice(0, 5).map((x) => x.g.toFixed(0) + ' s a partir de ' + (x.at / 60).toFixed(0) + ' min (' + x.a + '→' + x.b + ')').join(' · ')); }
if (G.pedidos && S().pedidos) {
  const P = S().pedidos, lt = ped.late.slice().sort((a, b) => a - b);
  console.log('Pedidos: ' + ped.novo + ' surgiram · ' + ped.entregue + ' entregues · ' + ped.expirou + ' expiraram · ' + ped.falhou + ' falharam · espera mediana até entregar ' + (lt.length ? lt[Math.floor(lt.length / 2)].toFixed(0) : '—') + ' s · por modelo (entregues/surgidos): ' + Object.keys(ped.byM).map((k) => k + ' ' + ped.byM[k].ok + '/' + ped.byM[k].n).join(', ') + ' · descontos ' + Object.keys(P.disc).length);
}
if (G.rollIns) {
  const gear = []; for (const h of S().heroes) for (const k in h.gear) if (h.gear[k]) gear.push(h.gear[k]);
  const ins = gear.reduce((a, it) => a + (it.ins ? it.ins.length : 0), 0), perf = gear.reduce((a, it) => a + G.insPerfect(it.ins), 0);
  console.log('Inscrições: ' + ins + ' nas ' + gear.length + ' peças equipadas (' + perf + ' perfeitas) · forjadas ' + S().stats.crafted + ' · reforjas ' + stats.reforges + ' (aceitas ' + stats.accepted + ') · Pó de Reforja ' + Math.floor(S().res.po_reforja || 0) + (G.S.sorte ? ' · garantia do Portal ' + G.S.sorte.pity + '/10' : ''));
}
if (G.arena && S().arena && S().arena.open) {
  const a = S().arena, L = G.ARENA_LEAGUES, last = a.hist[a.hist.length - 1];
  const cnt = {}; for (const h of a.hist) cnt[L[h.liga].name] = (cnt[L[h.liga].name] || 0) + 1;
  console.log('Arena: ' + arena.duels + ' duelos · ' + arena.wins + ' vitórias (' + (arena.duels ? (100 * arena.wins / arena.duels).toFixed(1) : '0') + '%, chance estimada média ' + (arena.duels ? (100 * arena.ch / arena.duels).toFixed(0) : '0') + '%)' +
    ' · liga final ' + (last ? L[last.liga].name + ' (' + last.pts + ' pts, ' + last.pos + 'º)' : '—') + ' · ' + a.hist.length + ' temporadas: ' + Object.keys(cnt).map((k) => k + ' ×' + cnt[k]).join(', ') + ' · Insígnias ' + a.ins + ' · títulos ' + a.titulos.reduce((n, t) => n + t.n, 0));
}
if (G.synFind) {
  const top = (o) => Object.keys(o).sort((a, b) => o[b] - o[a]).slice(0, 4).map((k) => k + ' ×' + o[k]).join(', ') || '—';
  console.log('Formação: ' + syn.duels + ' duelos · com combinação do nosso lado ' + syn.mine + ' · do rival ' + syn.rv + ' · decisiva ' + syn.dec + ' (nossa ' + syn.decMe + ') · mais vistas: ' + top(syn.names) + ' · Colosso: grupo com combinação em ' + syn.col + ' de ' + syn.colN + ' leituras' + (syn.colN ? ' (' + top(syn.colNames) + ')' : ''));
}
if (G.resList) {
  const hs = S().heroes, fam = {}, tiers = [0, 0, 0, 0];
  for (const h of hs) { const L = G.resList(G.resOf(h)); let mx = 0; for (const x of L) { if (x.t) { const k = x.f.name; fam[k] = fam[k] || [0, 0, 0]; fam[k][x.t - 1]++; } if (x.t > mx) mx = x.t; } tiers[mx]++; }
  console.log('Ressonância: heróis por nível mais alto (0/1/2/3) ' + tiers.join('/') + ' · por família (níveis 1/2/3): ' + Object.keys(fam).map((k) => k + ' ' + fam[k].join('/')).join(', '));
}
if (G.colosso && S().colosso) {
  const c = S().colosso, ws = colo.weeks, pos = ws.filter((w) => w.pos).map((w) => w.pos), fm = (v) => v >= 1e6 ? (v / 1e6).toFixed(2).replace('.', ',') + 'M' : v >= 1e3 ? (v / 1e3).toFixed(1).replace('.', ',') + 'k' : String(Math.round(v));
  const byId = {}; for (const w of ws) { const n = G.COLOSSI[w.id].name; byId[n] = (byId[n] || 0) + 1; }
  console.log('Colosso: ' + (ws.length + (c.hpMax ? 1 : 0)) + ' semanas (' + ws.length + ' fechadas' + (c.hpMax ? ' + a atual com ' + Math.round(100 * c.dmg / c.hpMax) + '%' + (c.win ? ', derrotado' : '') : '') + ') · avisos ' + colo.warn + ', despertares ' + colo.wake + ' · ' + Object.keys(byId).map((k) => k + ' ×' + byId[k]).join(', ') +
    ' · dano por semana: ' + (ws.length ? ws.map((w) => (w.pct >= 0.995 && w.pct < 1 ? '99,x' : Math.round(100 * w.pct)) + '%' + (w.win && w.bonus ? '+' + Math.round(100 * w.bonus / w.hpMax) : '')).join(' ') : '—') + ' (vida média ' + (ws.length ? fm(ws.reduce((a, w) => a + w.hpMax, 0) / ws.length) : '—') + ')' +
    ' · posição final: ' + (pos.length ? pos.join('º ') + 'º' : '—') + ' · derrotado ' + colo.wins + '/' + ws.length + ' · marcos ' + colo.marks + ' · baús ' + colo.chest.n + ' Núcleos, ' + colo.chest.s + ' Selos, ' + colo.chest.p + ' Pó · prêmios no total ' + c.pr.nuc + ' Núcleos, ' + c.pr.sel + ' Selos, ' + c.pr.po + ' Pó · modo ' + ['Livre', 'Convocar', 'Dispensar'][CMODE] + ' · lutadores em média ' + (colo.ss ? (colo.fs / colo.ss).toFixed(1) + ' de ' + (colo.hs / colo.ss).toFixed(1) + ' heróis' : '—') + ' · quedas honrosas ' + (ws.reduce((a, w) => a + (w.fl || 0), 0) + (c.fl || 0)) + ' (' + (colo.fs ? ((ws.reduce((a, w) => a + (w.fl || 0), 0) + (c.fl || 0)) / (colo.fs * 5 / 60)).toFixed(3) : '—') + ' por herói-minuto de luta)' + (CLAB && colo.labT ? ' · laboratório: ' + (colo.labDone ? 'derrubado após ' + ((colo.labDone - colo.labT) / 60).toFixed(1) + ' min de luta' : 'não derrubado em ' + ((t - colo.labT) / 60).toFixed(1) + ' min') : ''));
}
if (G.nemesis && S().rivais) {
  const nm = G.nemesis(), ls = G.lacoStats(), fm = (x) => (x ? (x / 60).toFixed(0) + 'min' : '—');
  console.log('Rivais: Nêmesis formados ' + rivs.nem + ' · revanches ' + rivs.revs + ' (vencidas ' + rivs.revWins + ', vinganças ' + rivs.vingados + ') · Nêmesis agora ' + (nm ? nm.riv.name + ' (rancor ' + nm.l + ')' : '—') + ' · visitas ' + (S().stats.visits || 0) + ' (só com tela)');
}
if (G.lacoStats) {
  const ls = G.lacoStats(), fm = (x) => (x ? (x / 60).toFixed(0) + 'min' : '—'), n = S().heroes.length;
  console.log('Laços: ' + ls.n + ' de ' + (n * (n - 1) / 2) + ' pares (Conhecidos ' + ls.c[1] + ' · Companheiros/Rivais ' + ls.c[2] + ' · Irmãos ' + ls.c[3] + ') · formados no total ' + rivs.lacos.slice(1).join('/') + ' · primeiro de cada nível em ' + fm(rivs.first[1]) + '/' + fm(rivs.first[2]) + '/' + fm(rivs.first[3]) + ' · títulos Vingador/Irmão ' + S().heroes.reduce((a, h) => a + (G.titleHas(h, 'vingador') ? 1 : 0), 0) + '/' + S().heroes.reduce((a, h) => a + (G.titleHas(h, 'irmao') ? 1 : 0), 0));
}
if (G.kingPower && S().lendas) {
  const L = S().lendas, P = G.kingPowerParts(true), fm = (v) => v >= 1e6 ? (v / 1e6).toString().replace('.', ',') + 'M' : v >= 1e3 ? (v / 1e3).toString().replace('.', ',') + 'k' : String(v);
  const uniq = {}; for (const x of lendas.titles) uniq[x.id] = 1;
  const per = S().heroes.map((h) => G.titleCount(h)).join('/');
  console.log('Lendas: ' + lendas.titles.length + ' títulos desbloqueados (' + Object.keys(uniq).length + ' de ' + G.TITLES.length + ' diferentes; por herói ' + per + ') · primeiro título em ' + (lendas.titles.length ? (lendas.titles[0].t / 60).toFixed(1) + ' min' : '—') + ' · Herói do Dia: ' + lendas.hod.length + ' dias com ' + Object.keys(lendas.hodIds).length + ' heróis diferentes · recordes anunciados ' + lendas.recs);
  console.log('Poder do Reino: ' + P.t + ' (heróis ' + P.h + ' · construções ' + P.b + ' · bênçãos ' + P.s + ' · obras ' + P.w + ') · marcos: ' + (lendas.marks.length ? lendas.marks.map((x) => fm(x.v) + '@' + (x.t / 60).toFixed(0) + 'm').join(' ') : '—') + (L.pw.back ? ' (+' + L.pw.back + ' já alcançados no início)' : ''));
  if (!QUIET || args.includes('--titles')) { const by = {}; for (const x of lendas.titles) (by[x.id] = by[x.id] || []).push((x.t / 60).toFixed(0)); console.log('Títulos (id: minutos): ' + G.TITLES.map((t) => t.id + ' [' + (by[t.id] ? by[t.id].length + ': ' + by[t.id].slice(0, 6).join(',') : '—') + ']').join(' · ')); }
  const rc = L.rec; console.log('Recordes: ' + G.RECS_ORDER.map((k) => G.RECS[k].name + ' ' + (rc[k] ? G.recText(k, rc[k]) : '—')).join(' · '));
}
if (G.codexStats && S().codex) { const cs = G.codexStats(); console.log('Códex: ' + cs.slots + '/' + cs.slotsMax + ' registros de inscrição (' + cs.ids + '/' + cs.idsMax + ' tipos, ' + cs.perf + ' perfeitas) · peças ' + cs.cells + '/' + cs.cellsMax + ' · marcos ' + Object.keys(S().codex.ms).length + '/' + G.CODEX_MS.length + ': ' + (codexMs.length ? codexMs.map((x) => x.id + '@' + (x.t / 60).toFixed(0) + 'm').join(' ') : '—')); }
if (RIFT || firstCan != null) console.log('Fenda Infinita: ' + rift.runs + ' expedições · ' + rift.wins + ' vitórias · andar ' + S().rift.floor + ' · Essência ' + Math.floor(S().res.essencia || 0) + ' · primeiro herói apto a renascer: ' + (firstCan == null ? '—' : firstCan + ' min'));
if (G.rbDo) { const hs = S().heroes, sv = hs.reduce((a, h) => a + (h.rr ? h.rr.sv : 0), 0), pend = hs.reduce((a, h) => a + G.rbPts(h), 0); console.log('Renascimentos: ' + reb.n + (reb.n ? ' · primeiro aos ' + reb.mins[0] + ' min (' + reb.names[0] + ') · todos: ' + reb.names.map((n, i) => n + '@' + reb.mins[i] + 'm').slice(0, 12).join(' ') : ' · nenhum em ' + MIN + ' min') + ' · pontos gastos ' + reb.spent + ' (sobram ' + pend + ') · traços raros ' + reb.rare + ' · níveis de traço ' + reb.ups + ' · esquecidos ' + reb.forgets + (sv ? ' · Coração Imortal salvou ' + sv + ' vezes' : '')); }
/* 3-D: quedas (heróis derrubados) — linha estável para a tabela por semente */
console.log('Quedas: ' + S().stats.falls + ' · abates ' + S().stats.kills + ' · Nível de Reino ' + S().realm.lvl + ' · heróis ' + S().heroes.length);
if (G.pieceTake) console.log('Peças caídas (pegas pelo robô ou levadas pelo herói): ' + (S().stats.pieces || 0) + ' ' + JSON.stringify(pieceRar) + ' · Pergaminhos: ' + (S().stats.scrollsGot || 0) + ' obtidos, ' + (S().res.pergaminho || 0) + ' guardados · alertas de perigo: ' + (S().stats.dangers || 0));
console.log('Primeira promoção: ' + first('promo') + ' · primeiro momento épico: ' + first('epic'));
if (!QUIET) for (const x of moments.slice(0, 60)) console.log('  [' + (x.t / 60).toFixed(1) + 'm] ' + x.k + ': ' + String(x.txt).slice(0, 110));
if (opt('save', '')) { fs.writeFileSync(opt('save', ''), G.serialize()); console.log('Save gravado em ' + opt('save', '')); }
if (errors.length) { console.log('\nERROS (' + errors.length + '):'); for (const e of errors.slice(0, 10)) console.log(e.split('\n').slice(0, 4).join('\n')); process.exit(1); }
console.log('\nSem erros.');
