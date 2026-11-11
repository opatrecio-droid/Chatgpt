// Campanha longa com jogador automático: node campanha.js <core.js> <dias> [semente] [opções]
// opções (separadas por vírgula): dificil = muda para o Difícil no Reino 6; sempet = nenhum herói leva mascote;
// seminc = o jogador automático não manda Incursões.
// Roda no núcleo da v21 e no da v22 (usa só o que existir) e mede o espólio recebido na Guilda.
const fs = require('fs'), vm = require('vm');
const file = process.argv[2], days = +process.argv[3] || 60; let a = +process.argv[4] || 21;
const OPT = String(process.argv[5] || '').split(','), DIF = OPT.includes('dificil'), SEMPET = OPT.includes('sempet'), SEMINC = OPT.includes('seminc');
Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
vm.runInThisContext(fs.readFileSync(file, 'utf8'));
const G = globalThis.G; G.DEBUG = 1; const errs = []; console.error = (...x) => errs.push(x.map(String).join(' '));
G.W.init(); G.newGame(); const S = G.S; const dt = 0.05; let lastRep = 0; const firsts = {};
const mark = (k) => { if (!firsts[k]) firsts[k] = S.day; };
/* espólio recebido: tudo que passa por questEvent('mat') (entrega na Guilda, carga do mascote, toque) */
const M = { zona: 0, raro: 0, po: 0, chave: 0, pet: 0 }; let petSrc = 0;
const qe = G.questEvent;
G.questEvent = (k, n, arg) => {
  if (k === 'mat' && G.RES[arg]) { const r = G.RES[arg]; if (r.emb || arg === 'tomo' || arg === 'alma') M.chave += n; else if (arg === 'po_estelar') M.po += n; else if (r.z) { M.zona += n; if (r.rare) M.raro += n; } if (petSrc && arg !== 'po_estelar' && r.z && !r.emb) M.pet += n; }
  return qe(k, n, arg);
};
if (G.petStore) { const ps = G.petStore; G.petStore = (p) => { petSrc++; try { return ps(p); } finally { petSrc--; } }; }
if (SEMPET && G.petAssign) G.petAssign = () => false;
/* calibragem: NOME=valor muda uma constante numérica de G (ex.: LOOT_F=1.7) */
for (const o of OPT) { const m2 = /^([A-Z_]+)=([\d.]+)$/.exec(o); if (m2 && typeof G[m2[1]] === 'number') G[m2[1]] = +m2[2]; }
const CH = { solta: 0 }; if (G.dropAdd) { const da = G.dropAdd; G.dropAdd = (x, y, k, n, b) => { if (G.RES[k].z && !G.RES[k].emb) CH.solta += n; return da(x, y, k, n, b); }; }
const inc = { win: 0, loss: 0 }, LOSS = {}; G.on('inc', (d) => { if (d && d.end) { const k = d.last.z + ':' + d.last.g; if (d.win) { inc.win++; LOSS[k] = 0; } else { inc.loss++; LOSS[k] = (LOSS[k] || 0) + 1; } } });
const player = () => {
  while (G.questCur().done) G.questClaim();
  S.daily.list.forEach((c, i) => G.contractClaim(i)); G.dailyChest();
  for (const a2 of G.ACH) G.achClaim(a2.id);
  if (G.PATHS) for (const d of G.PATHS) G.pathClaim(d.id);
  for (const id of G.BLD_IDS) if (S.b[id] && S.b[id].dmg) G.repair(id); // conserta o que a Maré danificou (o roteiro da v21 não consertava)
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
  /* v22: mascotes — os melhores vão com os heróis mais fortes; sobras da mesma raridade se fundem */
  if (G.PETS && !SEMPET) {
    for (const h of S.heroes.slice().sort((x, y) => G.heroStats(y).eff - G.heroStats(x).eff)) { const fr = G.petFree().sort((x, y) => y.rar - x.rar); if (!fr.length) break; const cur = G.petOf(h); if (!cur || fr[0].rar > cur.rar) { G.petAssign(fr[0], h); mark('mascote'); } }
    for (let r = 0; r < 5; r++) { const fr = G.petFree().filter((p) => p.rar === r); if (fr.length >= 3 && G.petFuse(fr.slice(0, 3))) mark('fusao'); }
  }
  for (const b of G.BLESS) if (S.selos > G.blessCost(S.bless[b.id] || 0) + 12) G.buyBless(b.id);
  for (const w of G.WORKS) if (S.gold > G.workCost(G.workLvl(w.id)) * 12) G.buyWork(w.id);
  if (G.riftOpen() && G.riftCanStart() && S.rift.dayDone !== S.day) { const p = S.heroes.filter((x) => x.state !== 'fallen' && x.state !== 'recover').sort((x, y) => G.heroStats(y).eff - G.heroStats(x).eff).slice(0, 5); if (p.length >= 3 && G.heroStats(p[0]).eff >= G.riftLvl(S.rift.floor)) G.riftStart(p.map((x) => x.id)); }
  /* v22: uma Incursão grátis por dia. Avança o Grau quando o Alfa cabe com folga no grupo (cada derrota naquele
     Grau pede 3 níveis a mais); senão repete o maior Grau vencido que seja seguro. */
  if (!SEMINC && G.incOpen && G.incOpen() && !G.incBusy() && G.incFree() && !S.rift.run && !S.mare.active) {
    const p = S.heroes.filter((x) => x.state !== 'fallen' && x.state !== 'recover' && x.state !== 'rift').sort((x, y) => G.heroStats(y).eff - G.heroStats(x).eff).slice(0, 5);
    if (p.length >= 3) {
      const e = (G.heroStats(p[0]).eff + G.heroStats(p[1]).eff + G.heroStats(p[2]).eff) / 3; let pick = null;
      for (const z of G.ZONES) if (G.zoneUnlocked(z)) { const g = G.incMax(z.id), l = G.incLvl(z.id, g); if (l + 2 + 3 * (LOSS[z.id + ':' + g] || 0) <= e && (!pick || l > pick.l)) pick = { z: z.id, g, l }; }
      if (!pick) for (const z of G.ZONES) if (G.zoneUnlocked(z)) for (let g = G.incBest(z.id); g >= 1; g--) { const l = G.incLvl(z.id, g); if (l + 2 <= e && (!pick || l > pick.l)) { pick = { z: z.id, g, l }; break; } }
      if (pick && G.incStart(pick.z, pick.g, p.map((x) => x.id))) mark('incursao');
    }
  }
  if (G.setDiff && S.diff === 1 && DIF && S.realm.lvl >= 6) G.setDiff(2);
};
const rep = () => {
  const hs = S.heroes, avg = (f) => (hs.reduce((s, h) => s + f(h), 0) / hs.length).toFixed(1);
  console.log('dia ' + String(S.day).padStart(3) + ' reino ' + String(S.realm.lvl).padStart(2) + ' ouro ' + G.fmt(S.gold).padStart(6) + ' heróis ' + hs.length + ' nv~' + avg((h) => h.lvl) + ' rank~' + avg((h) => h.rank) + ' peças~' + avg((h) => Object.values(h.gear).filter(Boolean).length) + ' j2:' + hs.filter((h) => h.j2).length + ' j3:' + hs.filter((h) => h.j3).length + ' desp~' + avg((h) => h.wake || 0) + ' mont:' + S.stable.list.length + ' | abates ' + S.stats.kills + ' quedas ' + S.stats.falls + ' chefes ' + S.stats.bosses + ' fenda ' + S.rift.best + ' | espólio zona ' + M.zona + ' (raros ' + M.raro + ') pó ' + M.po + ' chave ' + M.chave + (G.PETS ? ' | mascotes ' + S.pets.length + ' [' + G.RAR.map((n, i) => S.pets.filter((p) => p.rar === i).length).join('/') + '] carga ' + M.pet + ' | incursões ' + inc.win + 'V ' + inc.loss + 'D' : ''));
};
const t0 = Date.now();
for (let t = 0; S.day <= days; t += dt) { G.tick(dt); if (Math.floor(t / 15) !== Math.floor((t - dt) / 15)) player(); if (S.day >= lastRep + 10) { lastRep = S.day; rep(); } }
const secs = (Date.now() - t0) / 1000;
console.log('primeira vez (dia):', JSON.stringify(firsts)); console.log('erros', errs.length, errs.slice(0, 3).join(' | '), '· tempo', secs.toFixed(1) + 's');
if (G.PATHS) console.log('caminhos concluídos', Object.keys(S.paths).length + '/' + G.PATHS.length, '· relíquias', G.COS_IDS.filter((k) => G.COS[k].slot === 'reliquia' && G.cosOwned(k)).length);
const hs = S.heroes;
console.log('RESUMO ' + JSON.stringify({ reino: S.realm.lvl, nivel: +(hs.reduce((s, h) => s + h.lvl, 0) / hs.length).toFixed(1), quedas: S.stats.falls, chefes: S.stats.bosses, fenda: S.rift.best, abates: S.stats.kills, espolioZona: M.zona, raros: M.raro, po: M.po, chave: M.chave, carregadoPorMascote: M.pet, caiuNoChao: CH.solta, incursoes: inc.win + 'V/' + inc.loss + 'D', mascotes: G.PETS ? S.pets.length : 0, erros: errs.length, tempo: +secs.toFixed(1) }));
