/* Uso: node verificacao/compara.cjs antes.json depois.json — falha (exit 1) se estado, texto, erros ou layout mudarem. */
const fs = require('node:fs');
const [a, b] = process.argv.slice(2).map((f) => JSON.parse(fs.readFileSync(f, 'utf8')));
let duras = 0, leves = []; const n = Math.max(a.length, b.length);
for (let i = 0; i < n; i++) {
  const x = a[i] || {}, y = b[i] || {};
  const ks = [...new Set([...Object.keys(x), ...Object.keys(y)])].filter((k) => JSON.stringify(x[k]) !== JSON.stringify(y[k]));
  if (!ks.length) continue;
  const so = ks.filter((k) => k !== 'shot' && k !== 'fpc');
  if (!so.length && ks.length) { if (x.shot && y.shot || x.fpc) leves.push(x.tag + ' ' + x.label); continue; }
    duras++;
  if (duras <= 10) { console.log('DIFERE #' + i, x.tag, x.label, '|', y.label); for (const k of ks) console.log('    ', k, JSON.stringify(x[k]), '→', JSON.stringify(y[k])); }
}
console.log((duras ? 'FALHA: ' + duras + ' diferenças de ESTADO/TEXTO' : 'estado e texto IDÊNTICOS') + ' em ' + n + ' capturas; pixels diferentes: ' + leves.length + (leves.length ? ' (' + leves.join('; ') + ')' : ''));
process.exit(duras ? 1 : 0);
