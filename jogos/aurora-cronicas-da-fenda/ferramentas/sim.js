#!/usr/bin/env node
/* Simulador headless do Aurora.
   Uso: node ferramentas/sim.js [arquivo.html] [--min=120] [--seed=1] [--quiet]
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
  } catch (e) { errors.push('bot: ' + e.stack); }
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
console.log('Aurora sim · ' + path.basename(file) + ' · ' + MIN + ' min simulados em ' + secs.toFixed(1) + ' s · semente ' + SEED);
console.log('Amostras a cada 10 min:'); for (const x of samples) console.log('  ' + JSON.stringify(x));
console.log('Momentos: ' + moments.length + ' ' + JSON.stringify(byK));
console.log('Intervalo entre momentos: mediana ' + med.toFixed(0) + ' s, maior ' + max.toFixed(0) + ' s');
console.log('Primeira promoção: ' + first('promo') + ' · primeiro momento épico: ' + first('epic'));
if (!QUIET) for (const x of moments.slice(0, 60)) console.log('  [' + (x.t / 60).toFixed(1) + 'm] ' + x.k + ': ' + String(x.txt).slice(0, 110));
if (errors.length) { console.log('\nERROS (' + errors.length + '):'); for (const e of errors.slice(0, 10)) console.log(e.split('\n').slice(0, 4).join('\n')); process.exit(1); }
console.log('\nSem erros.');
