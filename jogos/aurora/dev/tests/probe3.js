'use strict';
const path = require('path');
const { load, start, run } = require('./headless');
const G = load(path.join(__dirname, '..', '..', 'aurora-cronicas-da-fenda.html')); const S = start(G, 271);
run(G, G.DAY_SEC * 12);
for (const z of G.ZONES.slice(0, 3)) console.log(z.id, 'tier', S.zones[z.id].tier, 'max', S.zones[z.id].maxTier, 'lvls', [0, 1, 2, 3, 4, 5, 6, 7].map(t => G.zoneLvl(z, t)).join(','), 'unlocked', G.zoneUnlocked(z));
console.log('avgHeroLvl', G.avgHeroLvl(), 'realm', S.realm.lvl, S.realm.xp + '/' + G.realmNeed(S.realm.lvl), 'diff shift', G.diffCur().shift);
const sample = {};
for (let i = 0; i < 300; i++) { run(G, 1); for (const h of S.heroes) { const k = h.name + ' ' + h.state + (h.state === 'inside' || h.state === 'goto' ? ':' + h.act : '') + (h.state === 'hunt' || h.state === 'travel' ? ':' + h.zone : ''); sample[k] = (sample[k] || 0) + 1; } }
console.log(Object.entries(sample).sort().map(([k, v]) => k + '=' + v).join('\n'));
for (const h of S.heroes) { const st = G.heroStats(h); console.log(h.name, h.cls, 'lvl', h.lvl, 'eff', st.eff, 'xp', Math.round(h.xp) + '/' + G.xpNeed(h.lvl), 'rank', h.rank, 'cap', G.RANK_CAP[h.rank], 'gold', Math.round(h.gold), 'why', h.why, '| gear', Object.values(h.gear).filter(Boolean).map(g => g.type + 't' + g.tier + 'r' + (g.rank || 0)).join(',')); }
console.log('quest', G.questCur().t, G.questCur().cur + '/' + G.questCur().n, 'promo mats', S.res.emb1, S.res.emb2, 'orders', JSON.stringify(G.tradeState().requests).slice(0, 300));
console.log('mons by zone', G.ZONES.slice(0, 2).map((z, zi) => z.id + ': ' + G.mons.filter(m => m.zi === zi && !m.dead).map(m => m.k + m.lvl).join(' ')).join('\n'));
