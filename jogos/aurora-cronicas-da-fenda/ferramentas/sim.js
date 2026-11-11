#!/usr/bin/env node
/* Simulador headless do Aurora.
   Uso: node ferramentas/sim.js [arquivo.html] [--min=120] [--seed=1] [--quiet] [--noreforge] [--week=forja|cacada|portal|ouro|none]   (v25: o robô também duela na Arena)
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
const WEEK = opt('week', '');                  // v24: força a semana temática (sem isso vale a semana real do relógio)
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
G.newGame();
const S = () => G.S;

const moments = []; const T0 = () => S().stats.played;
const mark = (k, txt) => moments.push({ t: T0(), k, txt });
G.on('realm', (d) => mark('reino', 'Nível de Reino ' + d.lvl));
G.on('promo', (h) => mark('promo', h.name + ' → rank ' + G.RANKS[h.rank]));
G.on('quest', () => mark('jornada', 'missão concluída'));
const origLog = G.log;
G.log = (msg, kind) => { if (kind === 'epic' || kind === 'boss') mark(kind, msg); return origLog(msg, kind); };

const stats = { reforges: 0, accepted: 0, perfect: 0 };
/* v25: a Arena usa um relógio próprio (G.arenaNow). Aqui cada dia de jogo vale um dia da Arena, começando numa segunda-feira, para o robô
   duelar até 5 vezes por dia de jogo e a temporada virar a cada 7 dias de jogo (testa o fim de temporada e o baú). */
const arena = { duels: 0, wins: 0, ch: 0, leagues: [], lastSea: -1 };
if (G.arenaNow) {
  const b0 = new Date(); b0.setHours(0, 0, 0, 0); b0.setDate(b0.getDate() - ((b0.getDay() + 6) % 7));
  G.arenaNow = () => b0.getTime() + ((S().day - 1) + S().clock / 1440) * 86400000;
}
/* ---------- jogador-robô ---------- */
let thinkT = 0;
const bot = () => {
  const st = S();
  try {
    while (G.questClaim()) {}
    st.daily.list.forEach((c, i) => G.contractClaim(i)); G.dailyChest();
    for (const a of G.ACH) G.achClaim(a.id);
    if (st.heroes.length < G.heroCap() && st.gold > G.recruitCost() * 1.3) {
      const c = G.rollCandidates('ouro').sort((a, b) => b.rar - a.rar)[0];
      if (G.spend(G.recruitCost(), 'recrutar')) G.hire(c);
    }
    for (const h of st.heroes) if (G.canPromote(h)) G.promote(h);
    for (const h of st.heroes) if (G.canRebirth && G.canRebirth(h)) G.rebirth(h);
    // construir/melhorar: o mais barato que der
    const opts = G.BLD_IDS.map((id) => [id, G.canUpgrade(id)]).filter(([, r]) => r.ok).sort((a, b) => a[1].c.gold - b[1].c.gold);
    if (opts.length && st.gold > opts[0][1].c.gold * 1.2) G.upgrade(opts[0][0]);
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
    if (G.arenaOpen) arenaBot(st);
  } catch (e) { errors.push('bot: ' + e.stack); }
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
let t = 0, nextBot = 0, nextSample = 0; const samples = [];
const t0 = Date.now();
while (t < TOTAL) {
  try { G.tick(DT); } catch (e) { errors.push('tick: ' + e.stack); if (errors.length > 20) break; }
  t += DT;
  if (t >= nextBot) { nextBot = t + 5; bot(); }
  if (t >= nextSample) {
    nextSample = t + 600;
    const st = S();
    samples.push({ min: Math.round(t / 60), dia: st.day, reino: st.realm.lvl, ouro: Math.round(st.gold), herois: st.heroes.length, lvls: st.heroes.map((h) => h.lvl).join('/'), ranks: st.heroes.map((h) => G.RANKS[h.rank]).join(''), kills: st.stats.kills, missao: st.quest.step, quedas: st.stats.falls });
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
console.log('Primeira promoção: ' + first('promo') + ' · primeiro momento épico: ' + first('epic'));
if (!QUIET) for (const x of moments.slice(0, 60)) console.log('  [' + (x.t / 60).toFixed(1) + 'm] ' + x.k + ': ' + String(x.txt).slice(0, 110));
if (errors.length) { console.log('\nERROS (' + errors.length + '):'); for (const e of errors.slice(0, 10)) console.log(e.split('\n').slice(0, 4).join('\n')); process.exit(1); }
console.log('\nSem erros.');
