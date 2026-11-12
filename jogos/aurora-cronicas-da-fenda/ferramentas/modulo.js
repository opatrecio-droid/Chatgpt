#!/usr/bin/env node
/* Extrai/grava um modulo do aurora.html (o bloco que comeca no marcador de comentario com o nome NN-nome.js e vai ate o proximo), para editar em arquivo comum.
   Uso: node ferramentas/modulo.js get NOME arquivo.js          (extrai o corpo do módulo)
        node ferramentas/modulo.js put NOME arquivo.js [ANTES]  (substitui o módulo; se não existir, insere antes do módulo ANTES, padrão 90-main)
   NOME sem ".js" (ex.: 3C-colosso). O corpo é tudo o que vem depois da linha do marcador. */
'use strict';
const fs = require('fs'), path = require('path');
const F = process.env.AURORA_FILE || path.join(__dirname, '..', 'aurora.html');
const [cmd, name, file, before] = process.argv.slice(2);
if (!cmd || !name || !file) { console.error('uso: modulo.js get|put NOME arquivo [ANTES]'); process.exit(2); }
let h = fs.readFileSync(F, 'utf8');
const mk = (n) => '/* ===== ' + n + '.js ===== */';
const SEP = '\n;\n';
const start = h.indexOf(mk(name));
const endOf = (s) => { const e = h.indexOf(SEP + '/* ===== ', s + 10); return e < 0 ? h.indexOf('\n</script>', s) : e; };
if (cmd === 'get') {
  if (start < 0) { console.error('módulo não encontrado: ' + name); process.exit(1); }
  const e = endOf(start);
  fs.writeFileSync(file, h.slice(start + mk(name).length + 1, e) + '\n');
  console.log('ok: ' + (e - start) + ' bytes -> ' + file);
} else if (cmd === 'put') {
  const body = fs.readFileSync(file, 'utf8').replace(/\s+$/, '');
  if (start >= 0) {
    const e = endOf(start);
    h = h.slice(0, start) + mk(name) + '\n' + body + h.slice(e);
  } else {
    const b = h.indexOf(mk(before || '90-main'));
    if (b < 0) { console.error('módulo-âncora não encontrado'); process.exit(1); }
    h = h.slice(0, b) + mk(name) + '\n' + body + SEP + h.slice(b);
  }
  fs.writeFileSync(F, h);
  console.log('ok: ' + name + ' gravado (' + body.length + ' bytes)');
} else { console.error('comando desconhecido'); process.exit(2); }
