// Compara duas versões do núcleo com o mesmo roteiro de campanha, em várias sementes.
// node comparar.js <coreA.js> <coreB.js> <dias> <sementes, ex.: 21,22,23> [opções da campanha] [paralelo]
// Roda cada campanha num processo próprio; o tempo de cada uma é medido sem concorrência quando paralelo = 1.
const { execFile } = require('child_process'), path = require('path');
const [A, B, days, seedsArg, opt, par] = process.argv.slice(2);
const seeds = String(seedsArg || '21').split(',').map(Number), P = +par || 2;
const camp = path.join(__dirname, 'campanha.js');
const jobs = []; for (const s of seeds) for (const [tag, f] of [['A', A], ['B', B]]) jobs.push({ tag, f, s });
const out = {};
const run = (j) => new Promise((res) => execFile('node', [camp, j.f, days, String(j.s), opt || ''], { maxBuffer: 1 << 24 }, (e, so) => {
  const ln = String(so).split('\n').filter((l) => l.startsWith('RESUMO ')).pop();
  out[j.tag + j.s] = ln ? JSON.parse(ln.slice(7)) : { erro: String(e && e.message) };
  res();
}));
(async () => {
  const q = jobs.slice(); await Promise.all(Array.from({ length: P }, async () => { while (q.length) await run(q.shift()); }));
  const K = ['reino', 'nivel', 'quedas', 'chefes', 'servicos', 'rendaTotal', 'esperas', 'extras', 'erros', 'tempo'];
  const fmt = (v) => (typeof v === 'number' ? (Math.abs(v) >= 1000 ? Math.round(v).toString() : (+v.toFixed(1)).toString()) : String(v));
  console.log(['semente', 'v'].concat(K).join('\t'));
  const sum = { A: {}, B: {} };
  for (const s of seeds) for (const t of ['A', 'B']) { const r = out[t + s] || {}; console.log([s, t].concat(K.map((k) => fmt(r[k] == null ? '-' : r[k]))).join('\t')); for (const k of K) if (typeof r[k] === 'number') sum[t][k] = (sum[t][k] || 0) + r[k]; }
  const n = seeds.length;
  for (const t of ['A', 'B']) console.log(['média', t].concat(K.map((k) => fmt((sum[t][k] || 0) / n))).join('\t'));
  console.log(['B/A', ''].concat(K.map((k) => (sum.A[k] ? ((100 * sum.B[k] / sum.A[k]).toFixed(1) + '%') : '-'))).join('\t'));
  if (process.env.DEGRAUS) for (const s of seeds) console.log('degraus', s, (out['B' + s] || {}).degraus);
})();
