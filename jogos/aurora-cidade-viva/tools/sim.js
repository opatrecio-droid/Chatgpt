/* Simulação sem tela: um "jogador-robô" joga N dias e imprime ritmo, economia e quedas.
   Uso: node tools/sim.js [dias] [passo] [estilo: ativo|preguicoso] */
const fs = require('fs'), path = require('path'), vm = require('vm');
const SRC = path.join(__dirname, '..', 'src');
const files = ['00-core.js', '10-data.js', '20-world.js', '30-heroes.js', '31-monsters.js', '32-town.js', '33-meta.js'];
const ctx = vm.createContext({ console, Math, Date, JSON, Object, Array, Set, Map, Uint8Array, Int8Array, Float32Array, Int32Array, Uint32Array, Number, String, isFinite, parseInt });
for (const f of files) vm.runInContext(fs.readFileSync(path.join(SRC, f), 'utf8'), ctx, { filename: f });
const G = ctx.G;
const DAYS = +process.argv[2] || 30, DT = +process.argv[3] || 0.1, STYLE = process.argv[4] || 'ativo';
G.W.init(); G.newGame();
const S = G.S;
const firsts = {};
const mark = (k) => { if (firsts[k] == null) firsts[k] = S.day; };

function bot() {
  // jornada e contratos
  while (G.questCur().done) G.questClaim();
  S.daily.list.forEach((c, i) => G.contractClaim(i)); G.dailyChest();
  for (const a of G.ACH) G.achClaim(a.id);
  // consertos
  for (const id of G.BLD_IDS) if (S.b[id] && S.b[id].dmg) G.repair(id);
  // promoções e renascimentos
  for (const h of S.heroes) { if (G.canPromote(h)) { G.promote(h); mark('rank' + G.RANKS[h.rank]); } if (G.canRebirth(h)) G.rebirth(h); }
  if (STYLE === 'preguicoso' && Math.random() < 0.7) return;
  // forja: equipa quem está sem peça do melhor tier possível
  const mt = G.forgeMaxTier();
  if (mt > 0) for (const h of S.heroes) {
    const c = G.CLASSES[h.cls];
    for (const [slot, type] of [['arma', c.w], ['armadura', c.a], ['acessorio', 'anel']]) {
      const cur = h.gear[slot];
      for (let t = mt; t >= 1; t--) {
        if (G.TIER_LVL(t) > h.lvl + 6) continue;
        if (cur && cur.tier >= t) break;
        if (S.inv.some((i) => i.forSale && i.type === type && i.tier >= t)) break;
        if (G.canCraft(type, t, false).ok) { G.craft(type, t, false); break; }
      }
    }
  }
  // sobras de vitrine antiga: derrete
  for (const it of S.inv.slice()) if (!S.heroes.some((h) => { const c = G.CLASSES[h.cls]; const cur = h.gear[G.GEAR[it.type].kind]; return (it.type === c.w || it.type === c.a || it.type === 'anel') && (!cur || G.itemScore(it) > G.itemScore(cur)); })) G.sellItem(it);
  // recrutas
  if (S.heroes.length < G.heroCap() && S.gold >= G.recruitCost() * 1.3) { const cs = G.rollCandidates('gold'); cs.sort((a, b) => b.rar - a.rar); G.spend(G.recruitCost(), 'recrutas'); G.hire(cs[0]); }
  // construções: primeiro o que a jornada pede, depois a melhoria mais barata
  const order = ['enfermaria', 'ferraria', 'pedreira', 'lenharia', 'alquimista', 'mercado', 'padaria', 'treino', 'torre', 'santuario'];
  for (const id of order) if (G.bLvl(id) === 0 && G.canUpgrade(id).ok) { G.upgrade(id); return; }
  let best = null, bc = 1e18;
  for (const id of G.BLD_IDS) { if (G.bLvl(id) === 0) continue; const r = G.canUpgrade(id); if (r.ok && r.c.gold < bc && S.gold > r.c.gold * 1.4) { bc = r.c.gold; best = id; } }
  if (best) G.upgrade(best);
  // compra materiais básicos que travam obras
  if (G.bOk('mercado')) for (const id of ['madeira', 'pedra', 'minerio']) if ((S.res[id] || 0) < 20 && S.gold > 400) G.buyRes(id, 20);
  // obras públicas com o que sobra
  for (const w of G.WORKS) if (S.gold > G.workCost(G.workLvl(w.id)) * 2.5) G.buyWork(w.id);
  // bênçãos
  for (const b of G.BLESS) { const l = S.bless[b.id] || 0; if (S.selos >= G.blessCost(l) + 2) G.buyBless(b.id); }
  // Fenda
  if (G.riftCanStart() && S.rift.dayDone !== S.day) { const hs = S.heroes.filter((h) => h.state === 'town' || h.state === 'idle' || h.state === 'hunt').sort((a, b) => G.heroStats(b).eff - G.heroStats(a).eff).slice(0, 5); if (hs.length >= 4 && G.heroStats(hs[hs.length - 1]).eff >= G.riftLvl(S.rift.floor) + 3) G.riftStart(hs.map((h) => h.id)); }
}

let lastDay = 1, botT = 0, fallsDay = 0;
const t0 = Date.now();
G.on('herofall', () => fallsDay++);
console.log('dia | reino | ouro | heróis (nv médio / máx / eff) | ranks | abates | quedas | renda/dia | zonas(tier) | construções');
while (S.day <= DAYS) {
  G.tick(DT);
  botT -= DT; if (botT <= 0) { botT = 8; bot(); }
  if (S.day !== lastDay) {
    lastDay = S.day;
    const hs = S.heroes, lv = hs.map((h) => h.lvl);
    const r = S.rep.last || {};
    if (S.day <= 12 || S.day % 5 === 0) {
      console.log([
        String(S.day - 1).padStart(3), 'R' + S.realm.lvl, G.fmt(S.gold).padStart(7),
        hs.length + 'h nv ' + (lv.reduce((a, b) => a + b, 0) / lv.length).toFixed(1) + '/' + Math.max(...lv) + ' eff ' + Math.round(hs.reduce((a, h) => a + G.heroStats(h).eff, 0) / hs.length),
        hs.map((h) => G.RANKS[h.rank]).sort().join(''),
        'K' + (r.kills || 0), 'Q' + (r.falls || 0), '+' + G.fmt(r._in || 0) + '/-' + G.fmt(r._out || 0),
        G.ZONES.filter(G.zoneUnlocked).map((z) => z.id.slice(0, 3) + S.zones[z.id].tier + (S.zones[z.id].bossKills ? '*' + S.zones[z.id].bossKills : '')).join(' '),
        'B' + G.BLD_IDS.filter((id) => G.bLvl(id) > 0).length + ' Σnv' + G.BLD_IDS.reduce((a, id) => a + G.bLvl(id), 0),
        'jornada ' + S.quest.step, 'pop ' + S.pop, 'fenda ' + S.rift.best, 'maré ' + S.mare.wins + '/' + S.mare.losses,
      ].join(' | '));
    }
  }
}
console.log('\nmarcos (dia):', JSON.stringify(firsts));
console.log('totais:', JSON.stringify({ abates: S.stats.kills, quedas: S.stats.falls, chefes: S.stats.bosses, forjados: S.stats.crafted, vendidos: S.stats.sold, ouroIn: Math.round(S.stats.goldIn), ouroOut: Math.round(S.stats.goldOut), selos: S.selos, nucleos: S.nucleos }));
console.log('recursos:', JSON.stringify(Object.fromEntries(Object.entries(S.res).map(([k, v]) => [k, Math.round(v)]))));
console.log('heróis:', S.heroes.map((h) => h.name + ' ' + h.cls + ' nv' + h.lvl + ' ' + G.RANKS[h.rank] + ' $' + Math.round(h.gold) + ' q' + h.falls + ' k' + h.kills).join('; '));
console.log('tempo real da simulação: ' + ((Date.now() - t0) / 1000).toFixed(1) + 's');
