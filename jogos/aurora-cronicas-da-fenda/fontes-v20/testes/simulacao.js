// Simulação sem tela: node sim.js <core.js> <dias> [seed]
const fs = require('fs'), vm = require('vm');
const file = process.argv[2], days = +process.argv[3] || 6, seed = +process.argv[4] || 7;
// RNG determinístico para comparar versões
let a = seed >>> 0; Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
vm.runInThisContext(fs.readFileSync(file, 'utf8'), { filename: file });
const G = globalThis.G;
G.W.init(); G.newGame();
const S = G.S; const errs = [];
G.DEBUG = 1; const ce = console.error; console.error = (...x) => { errs.push(x.map(String).join(' ')); };
const dt = 0.05; const total = days * G.DAY_SEC;
let t0 = Date.now();
for (let t = 0; t < total; t += dt) {
  G.tick(dt);
  // jogador mínimo: constrói e contrata quando dá
  if (Math.floor(t / 20) !== Math.floor((t - dt) / 20)) {
    for (const id of G.BLD_IDS) if (G.canUpgrade(id).ok && S.gold > G.bCost(id, G.bLvl(id) + 1).gold * 1.5) G.upgrade(id);
    if (S.heroes.length < G.heroCap() && S.gold > G.recruitCost() * 2) { const c = G.rollCandidates('gold')[0]; if (G.spend(G.recruitCost(), 'recrutas')) G.hire(c); }
    for (const h of S.heroes) if (G.canPromote(h)) G.promote(h);
    if (G.bOk('ferraria')) for (const h of S.heroes) { const slots = G.heroSlots ? G.heroSlots(h) : [['arma', G.CLASSES[h.cls].w], ['armadura', G.CLASSES[h.cls].a], ['acessorio', 'anel']]; for (const [sl, ty] of slots) if (!h.gear[sl] && !S.inv.some((i) => i.type === ty) && G.canCraft(ty, 1, false).ok) G.craft(ty, 1, false, true); }
    while (G.questCur().done) G.questClaim();
  }
}
console.error = ce;
const out = { file, days: S.day, ms: Date.now() - t0, gold: Math.round(S.gold), realm: S.realm.lvl, kills: S.stats.kills, falls: S.stats.falls, bosses: S.stats.bosses, heroes: S.heroes.map((h) => h.name + ' ' + h.cls + ' L' + h.lvl + ' r' + h.rank + ' eff' + G.heroStats(h).eff + ' g' + Math.round(h.gold) + ' gear' + Object.values(h.gear).filter(Boolean).length + (h.ap != null ? ' ap' + h.ap : '')).join(' | '), blds: G.BLD_IDS.filter((i) => G.bLvl(i)).map((i) => i + G.bLvl(i)).join(' '), quest: S.quest.step, res: Object.keys(S.res).filter((k) => S.res[k] >= 1).map((k) => k + ':' + Math.floor(S.res[k])).join(' '), errs: errs.slice(0, 5), nerr: errs.length };
console.log(JSON.stringify(out, null, 1));
