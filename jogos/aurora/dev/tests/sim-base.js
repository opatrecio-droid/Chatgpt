'use strict';
const path = require('path');
const { load, start, run } = require('./headless');
const file = process.argv[2] || path.join(__dirname, '..', '..', 'aurora-cronicas-da-fenda.html');
const days = +(process.argv[3] || 6), seed = +(process.argv[4] || 271);
const t0 = Date.now();
const G = load(file);
if (G._skipped.length) console.log('scripts com erro sem tela:', G._skipped);
const S = start(G, seed);
const falls = {}, bossFalls = {};
G.hook('heroFallen', (h, m) => { const k = m ? m.k : 'dot'; falls[k] = (falls[k] || 0) + 1; if (m && m.boss) bossFalls[S.day] = (bossFalls[S.day] || 0) + 1; });
for (let d = 1; d <= days; d++) {
  run(G, G.DAY_SEC);
  console.log('dia', d, 'reino', S.realm.lvl, 'ouro', Math.round(S.gold), 'herois', S.heroes.map(h => h.cls + h.lvl + '/' + (h.falls || 0)).join(' '),
    'chefes', S.stats.bosses, 'quedas', S.stats.falls, 'abates', S.stats.kills, 'mare', S.mare.wins + '-' + S.mare.losses, 'zonas', G.ZONES.filter(G.zoneUnlocked).map(z => z.id + ':' + S.zones[z.id].tier + (S.zones[z.id].boss ? '*' : '')).join(','), 'err', G.errorCount);
}
console.log('quedas por monstro', JSON.stringify(falls));
console.log('quedas para chefe por dia', JSON.stringify(bossFalls));
if (G.errorCount) console.log(G.errors.slice(0, 5).map(e => e.event + ': ' + e.message + '\n' + e.stack.split('\n').slice(0, 3).join('\n')).join('\n'));
console.log('tempo', Date.now() - t0, 'ms');
