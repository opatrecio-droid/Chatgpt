'use strict';
/* Indicadores de ritmo em várias sementes: níveis, quedas, chefes, Maré e investidas. */
const path = require('path');
const { load, start, run } = require('./headless');
const file = path.join(__dirname, '..', '..', 'aurora-cronicas-da-fenda.html');
const days = +(process.argv[2] || 12), seeds = (process.argv[3] || '271,7,1234').split(',').map(Number);
for (const seed of seeds) {
  const G = load(file); const S = start(G, seed);
  const falls = {}, rally = { win: 0, fail: 0, studied: 0, studiedWin: 0 }; const mare = [];
  G.hook('heroFallen', (h, m) => { const k = m ? (m.boss ? 'CHEFE ' : m.raid ? 'MARÉ ' : '') + m.k : 'dot'; falls[k] = (falls[k] || 0) + 1; });
  let cur = null;
  G.on('rally', (e) => { if (e.phase === 'call') cur = e; if (e.phase === 'end') { if (e.result === 'win') { rally.win++; if (cur && cur.studied) rally.studiedWin++; } else if (e.result === 'fail') rally.fail++; if (cur && cur.studied && (e.result === 'win' || e.result === 'fail')) rally.studied++; } });
  G.on('mare', (e) => { if (!e.on) mare.push('d' + S.day + (e.win ? ' venceu' : ' perdeu') + ' ' + e.a.killed + '/' + e.a.total + ' nv herois ' + S.heroes.map(h => h.lvl).join(',')); });
  console.log('=== semente', seed);
  for (let d = 1; d <= days; d++) {
    run(G, G.DAY_SEC);
    if (d % 2 === 0 || d === days) console.log(' dia', d, 'reino', S.realm.lvl, 'ouro', Math.round(S.gold), 'herois', S.heroes.map(h => h.cls + h.lvl + 'r' + h.rank).join(' '), 'chefes', S.stats.bosses, 'quedas', S.stats.falls, 'jornada', S.quest.step, 'err', G.errorCount);
  }
  console.log(' maré:', mare.join(' | ') || 'nenhuma');
  console.log(' investidas:', JSON.stringify(rally), 'zonas:', G.ZONES.filter(G.zoneUnlocked).map(z => z.id + ' t' + S.zones[z.id].tier + ' bk' + S.zones[z.id].bossKills + ' bf' + (S.zones[z.id].bf || 0)).join(', '));
  console.log(' quedas:', JSON.stringify(falls));
  if (G.errorCount) console.log(G.errors.slice(0, 4).map(e => e.event + ': ' + e.message + '\n' + e.stack.split('\n').slice(0, 3).join('\n')).join('\n'));
}
