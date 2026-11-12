#!/usr/bin/env node
/* Carrega os módulos de simulação (sem DOM) no Node. Uso: node tools/sim.js [segundos de jogo] [dt]
   Também serve de biblioteca: const G = require('./tools/sim.js').load(); */
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = path.join(__dirname, '..', 'src');
exports.load = () => {
  const order = fs.readFileSync(path.join(src, 'order.txt'), 'utf8').split(/\s+/).filter(Boolean);
  const code = order.map((n) => '/* ' + n + ' */\n' + fs.readFileSync(path.join(src, 'js', n), 'utf8')).join('\n');
  vm.runInThisContext(code, { filename: 'aurora-bundle.js' });
  return globalThis.G;
};
if (require.main === module) {
  const G = exports.load();
  const secs = +process.argv[2] || 3600, dt = +process.argv[3] || 0.034;
  G.W.init(); G.newGame();
  const t0 = Date.now(); let n = 0;
  for (let t = 0; t < secs; t += dt) { G.tick(dt); n++; }
  const S = G.S, ms = Date.now() - t0;
  console.log(JSON.stringify({ secs, dt, ticks: n, ms, usPerTick: +(ms * 1000 / n).toFixed(1), day: S.day, gold: Math.round(S.gold), heroes: S.heroes.length, kills: S.stats.kills }));
}
