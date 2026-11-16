'use strict';
/* Acompanha as investidas contra chefes numa partida simulada. */
const path = require('path');
const { load, start, run } = require('./headless');
const file = process.argv[2] || path.join(__dirname, '..', '..', 'aurora-cronicas-da-fenda.html');
const days = +(process.argv[3] || 8), seed = +(process.argv[4] || 271);
const G = load(file); const S = start(G, seed);
const falls = {};
G.hook('heroFallen', (h, m) => { const k = m ? m.k : 'dot'; falls[k] = (falls[k] || 0) + 1; });
G.on('rally', (e) => { const st = G.rallyState(e.z); console.log('  [d' + S.day + ' ' + G.clockStr(S.clock) + '] ' + e.z + ' ' + e.phase + (e.result ? ':' + e.result : '') + (e.studied ? ' (estudado)' : '') + ' membros=' + st.members + ' derrotas=' + st.fails + ' desconf=' + st.wary.toFixed(2) + ' herois=' + S.heroes.map(h => h.cls + h.lvl + (h.state === 'fallen' || h.state === 'recover' ? '†' : '')).join(' ')); });
G.on('boss', (e) => console.log('  [d' + S.day + ' ' + G.clockStr(S.clock) + '] CHEFE ' + e.z + ' nv ' + e.m.lvl + ' hp ' + e.m.hpMax + ' chance(todos)=' + (G.rallyOdds(e.z) || 0).toFixed(2)));
G.on('bosskill', (e) => console.log('  [d' + S.day + ' ' + G.clockStr(S.clock) + '] VITÓRIA ' + e.z));
for (let d = 1; d <= days; d++) {
  run(G, G.DAY_SEC);
  console.log('dia', d, 'reino', S.realm.lvl, 'herois', S.heroes.map(h => h.cls + h.lvl + '/' + (h.falls || 0)).join(' '), 'chefes', S.stats.bosses, 'quedas', S.stats.falls, 'mare', S.mare.wins + '-' + S.mare.losses, 'err', G.errorCount);
}
console.log('quedas por monstro', JSON.stringify(falls));
if (G.errorCount) console.log(G.errors.slice(0, 6).map(e => e.event + ': ' + e.message + '\n' + e.stack.split('\n').slice(0, 4).join('\n')).join('\n'));
