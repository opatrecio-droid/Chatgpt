#!/usr/bin/env node
/* Aplica edições exatas no aurora.html (que tem linhas enormes, ruins para editores).
   Uso: node ferramentas/ed.js edicoes.js   (edicoes.js exporta [[antigo, novo], ...]; cada "antigo" deve ocorrer exatamente 1 vez) */
'use strict';
const fs = require('fs'), path = require('path');
const F = path.join(__dirname, '..', 'aurora.html');
let h = fs.readFileSync(F, 'utf8');
const edits = require(path.resolve(process.argv[2]));
for (const [o, n] of edits) {
  const c = h.split(o).length - 1;
  if (c !== 1) { console.error('FALHA: ' + c + ' ocorrências de: ' + o.slice(0, 110)); process.exit(1); }
  h = h.replace(o, () => n);
}
fs.writeFileSync(F, h);
console.log('ok', edits.length, 'edições');
