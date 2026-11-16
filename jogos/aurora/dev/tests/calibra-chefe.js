'use strict';
/* Compara a chance prevista pelo avaliador oculto (G.bossOdds) com o resultado real das investidas.
   Uso: node calibra-chefe.js [dias] [sementes separadas por vírgula] */
const path = require('path');
const { load, start, run } = require('./headless');
const file = path.join(__dirname, '..', '..', 'aurora-cronicas-da-fenda.html');
const days = +(process.argv[2] || 8), seeds = (process.argv[3] || '1,2,3,4,5,6,7,8').split(',').map(Number);
const rows = [];
for (const seed of seeds) {
  const G = load(file); const S = start(G, seed);
  G.on('rally', (e) => { if (e.phase === 'end' && (e.result === 'win' || e.result === 'fail') && e.pred != null) rows.push({ seed, day: S.day, z: e.z, pred: e.pred, win: e.result === 'win' ? 1 : 0, falls: e.falls, studied: e.studied }); });
  run(G, G.DAY_SEC * days);
  process.stdout.write('.');
}
console.log('\n' + rows.length + ' investidas');
const buckets = [[0, 0.2], [0.2, 0.5], [0.5, 0.8], [0.8, 0.95], [0.95, 1.01]];
for (const [a, b] of buckets) {
  const r = rows.filter((x) => x.pred >= a && x.pred < b); if (!r.length) { console.log(`previsto ${a}-${b}: sem amostras`); continue; }
  const w = r.reduce((n, x) => n + x.win, 0), f = r.reduce((n, x) => n + x.falls, 0);
  console.log(`previsto ${a.toFixed(2)}-${b.toFixed(2)}: ${r.length} investidas · venceu ${(100 * w / r.length).toFixed(0)}% · previsão média ${(100 * r.reduce((n, x) => n + x.pred, 0) / r.length).toFixed(0)}% · quedas/investida ${(f / r.length).toFixed(2)}`);
}
const st = rows.filter((x) => x.studied);
console.log('em modo de estudo:', st.length, 'investidas, vitórias', st.reduce((n, x) => n + x.win, 0));
