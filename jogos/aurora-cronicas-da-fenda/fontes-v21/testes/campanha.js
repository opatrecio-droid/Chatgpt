// Campanha longa com jogador automático que usa os sistemas novos: node campanha.js <core.js> <dias> [seed]
const fs = require('fs'), vm = require('vm');
const file = process.argv[2], days = +process.argv[3] || 60; let a = +process.argv[4] || 21;
Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
vm.runInThisContext(fs.readFileSync(file, 'utf8'));
const G = globalThis.G; G.DEBUG = 1; const errs = []; console.error = (...x) => errs.push(x.map(String).join(' '));
G.W.init(); G.newGame(); const S = G.S; const dt = 0.05; let lastRep = 0; const firsts = {};
const mark = (k) => { if (!firsts[k]) firsts[k] = S.day; };
const player = () => {
  while (G.questCur().done) G.questClaim();
  S.daily.list.forEach((c, i) => G.contractClaim(i)); G.dailyChest();
  for (const a2 of G.ACH) G.achClaim(a2.id);
  if (G.PATHS) for (const d of G.PATHS) G.pathClaim(d.id);
  for (const id of G.BLD_IDS) { const r = G.canUpgrade(id); if (r.ok && S.gold > r.c.gold * 1.6) { G.upgrade(id); if (id === 'estabulo') mark('estabulo'); } }
  if (S.heroes.length < G.heroCap() && S.gold > G.recruitCost() * 2.5) { const c = G.rollCandidates('gold').sort((x, y) => y.rar - x.rar)[0]; if (G.spend(G.recruitCost(), 'recrutas')) G.hire(c); }
  for (const h of S.heroes) {
    if (G.canPromote(h)) G.promote(h);
    if (G.canRebirth(h)) { G.rebirth(h); mark('renascer'); }
    if (G.canJob && G.canJob(h)) { const o = G.jobOptions(h); if (G.changeJob(h, o[Math.floor(Math.random() * o.length)])) mark(h.j3 ? 'classe3' : 'classe2'); }
    if (G.canWake && G.canWake(h) && S.gold > G.wakeNext(h).gold * 3) { G.wake(h); mark('despertar' + h.wake); }
    if (G.artAuto) G.artAuto(h);
    if (G.canSkillUp) for (let i = 0; i < 3; i++) { const r = G.canSkillUp(h, i); if (r.ok && S.gold > r.c.gold * 8 && (S.res.tomo || 0) > 8) G.skillUp(h, i); }
    if (h.state === 'recover' && S.gold > 2000) G.reviveNow(h);
  }
  if (G.bOk('ferraria')) { const mt = G.forgeMaxTier(); for (const h of S.heroes) for (const [sl, ty] of (G.heroSlots ? G.heroSlots(h) : [])) { if (G.gearUnlocked && !G.gearUnlocked(ty)) continue; let t = mt; while (t > 1 && G.TIER_LVL(t) > h.lvl + 6) t--; const cur = h.gear[sl]; if ((!cur || cur.tier < t) && !S.inv.some((i) => i.type === ty && i.tier >= t) && G.canCraft(ty, t, false).ok && S.gold > G.recipe(ty, t).gold * 4) G.craft(ty, t, false, true); } }
  if (G.MOUNT_IDS && G.bOk('estabulo')) {
    for (const k of G.MOUNT_IDS.slice().reverse()) if (G.canTame(k).ok && S.gold > G.MOUNTS[k].gold * 4) { G.tame(k); mark('montaria'); break; }
    for (const mt of S.stable.list) { if (!mt.hero) { const h = S.heroes.find((x) => !x.mount); if (h) G.mountAssign(mt, h); } if ((S.res.racao || 0) > 12) G.mountFeed(mt, 4); }
  }
  if (G.DECOR) for (const d of G.DECOR) { const r = G.canDecor(d.id); if (r.ok && S.gold > r.c.gold * 5) { G.buyDecor(d.id); mark('enfeite'); } }
  if (G.COS_IDS) for (const id of G.COS_IDS) { const d = G.COS[id]; if (!d.cost || G.cosOwned(id) >= 2 || !G.cosCan(id).ok) continue; if ((d.cost.gold || 0) * 6 > S.gold || (d.cost.selos || 0) * 3 > S.selos) continue; if (G.cosBuy(id)) { mark('guarda-roupa'); const h = S.heroes.find((x) => !x.cos[d.slot]); if (h) G.cosWear(h, d.slot, id); } }
  if (G.COS_IDS) for (const id of G.COS_IDS) if (G.COS[id].slot === 'reliquia' && G.cosFree(id) > 0) { mark('reliquia'); const h = S.heroes.slice().sort((x, y) => y.lvl - x.lvl).find((x) => !x.cos.reliquia); if (h) G.cosWear(h, 'reliquia', id); }
  for (const b of G.BLESS) if (S.selos > G.blessCost(S.bless[b.id] || 0) + 12) G.buyBless(b.id);
  for (const w of G.WORKS) if (S.gold > G.workCost(G.workLvl(w.id)) * 12) G.buyWork(w.id);
  if (G.riftOpen() && G.riftCanStart() && S.rift.dayDone !== S.day) { const p = S.heroes.filter((x) => x.state !== 'fallen' && x.state !== 'recover').sort((x, y) => G.heroStats(y).eff - G.heroStats(x).eff).slice(0, 5); if (p.length >= 3 && G.heroStats(p[0]).eff >= G.riftLvl(S.rift.floor)) G.riftStart(p.map((x) => x.id)); }
  if (G.setDiff && S.diff === 1 && process.argv[5] === 'dificil' && S.realm.lvl >= 6) G.setDiff(2);
};
const rep = () => {
  const hs = S.heroes, avg = (f) => (hs.reduce((s, h) => s + f(h), 0) / hs.length).toFixed(1);
  console.log('dia ' + String(S.day).padStart(3) + ' reino ' + String(S.realm.lvl).padStart(2) + ' ouro ' + G.fmt(S.gold).padStart(6) + ' heróis ' + hs.length + ' nv~' + avg((h) => h.lvl) + ' rank~' + avg((h) => h.rank) + ' peças~' + avg((h) => Object.values(h.gear).filter(Boolean).length) + (G.JOBS ? ' j2:' + hs.filter((h) => h.j2).length + ' j3:' + hs.filter((h) => h.j3).length + ' desp~' + avg((h) => h.wake || 0) + ' artes~' + avg((h) => G.artSpent(h)) + ' mont:' + S.stable.list.length : '') + ' | abates ' + S.stats.kills + ' quedas ' + S.stats.falls + ' chefes ' + S.stats.bosses + ' fenda ' + S.rift.best + (G.JOBS ? ' | tomo ' + Math.floor(S.res.tomo || 0) + ' alma ' + Math.floor(S.res.alma || 0) + ' pó ' + Math.floor(S.res.po_estelar || 0) + ' ração ' + Math.floor(S.res.racao || 0) + ' selos ' + S.selos : ''));
};
const t0 = Date.now();
for (let t = 0; S.day <= days; t += dt) { G.tick(dt); if (Math.floor(t / 15) !== Math.floor((t - dt) / 15)) player(); if (S.day >= lastRep + 10) { lastRep = S.day; rep(); } }
console.log('primeira vez (dia):', JSON.stringify(firsts)); console.log('erros', errs.length, errs.slice(0, 3).join(' | '), '· tempo', Math.round((Date.now() - t0) / 1000) + 's');
if (G.PATHS) console.log('caminhos concluídos', Object.keys(S.paths).length + '/' + G.PATHS.length, '· relíquias', G.COS_IDS.filter((k) => G.COS[k].slot === 'reliquia' && G.cosOwned(k)).length);
