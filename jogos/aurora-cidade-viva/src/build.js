#!/usr/bin/env node
/* Monta a versão 18: injeta a camada "Ascensão" (CSS + JS) no protótipo base.
   Uso: node build.js <base.html> <saida.html>
   A base pode ser a v17 original ou uma v18 já montada (o bloco antigo é substituído). */
const fs = require('fs');
const path = require('path');

const [, , basePath, outPath] = process.argv;
if (!basePath || !outPath) { console.error('uso: node build.js <base.html> <saida.html>'); process.exit(1); }

const here = __dirname;
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8');
const START = '<!-- ASCENSAO:INICIO -->';
const END = '<!-- ASCENSAO:FIM -->';

let html = fs.readFileSync(basePath, 'utf8');
const a = html.indexOf(START), b = html.indexOf(END);
if (a >= 0 && b > a) html = html.slice(0, a) + html.slice(b + END.length);

const block = START + '\n<style id="aurora-ascensao-styles">\n' + read('asc.css') + '</style>\n<script>\n' +
  read('asc-core.js') + '\n' + read('asc-ui.js') + '\n' + read('asc-fx.js') + '</script>\n' + END;

const at = html.lastIndexOf('</body>');
if (at < 0) { console.error('base sem </body>'); process.exit(1); }
html = html.slice(0, at) + block + '\n' + html.slice(at);
html = html.replace('<meta name="cidade-viva-build" content="Aurora_ciclo_001_tempo - 2026-11-04">', '<meta name="cidade-viva-build" content="Aurora_ciclo_029_ascensao">');
html = html.replace('<title>Aurora — Cidade Viva</title>', '<title>Aurora — Crônicas da Fenda</title>');

fs.writeFileSync(outPath, html);
console.log('ok', outPath, (html.length / 1048576).toFixed(2) + ' MB');
