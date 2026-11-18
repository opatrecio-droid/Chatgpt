#!/usr/bin/env node
/* Monta www/index.html a partir do jogo (fonte/) + módulos (modulos/) + config (config/).
   Este script não altera o jogo: só injeta, no fim, o menu e a camada de plataforma.
   Uso: node ferramentas/montar.mjs            (gera www/index.html)
        node ferramentas/montar.mjs --verificar (falha se www/index.html estiver desatualizado) */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const ler = (p) => readFileSync(resolve(raiz, p), 'utf8');
const sha = (s) => createHash('sha256').update(s).digest('hex');

const ORIGINAL = process.env.AURORA_FONTE || 'fonte/aurora-046-animacoes.html';   // AURORA_FONTE/AURORA_SAIDA: só para testar variantes
const html = ler(ORIGINAL);
if (!html.includes('</head>') || !html.includes('</body>')) throw new Error('HTML original sem </head> ou </body>.');
if (html.includes('id="aurora-menu-inicial"')) throw new Error('A fonte já contém o menu; use o HTML do jogo sem os módulos.');

const json = (p) => JSON.stringify(JSON.parse(ler(p))).replace(/<\/(script)/gi, '<\\/$1');   // valida e compacta
const js = (p) => ler(p).replace(/<\/(script)/gi, '<\\/$1');

const css = ler('modulos/menu-inicial.css');
const marca = `aurora-plataforma:${sha(css + js('modulos/plataforma.js') + js('modulos/menu-inicial.js') + json('config/plataformas.json') + json('config/pc-controles.json')).slice(0, 12)}`;

const antesDoHead = `<meta name="aurora-plataforma" content="${marca}">\n<style id="aurora-menu-inicial">\n${css}\n</style>\n`;
const antesDoBody = [
  `<script type="application/json" id="aurora-cfg-plataformas">${json('config/plataformas.json')}</script>`,
  `<script type="application/json" id="aurora-cfg-controles">${json('config/pc-controles.json')}</script>`,
  `<script id="aurora-plataforma">\n${js('modulos/plataforma.js')}\n</script>`,
  `<script id="aurora-menu-inicial">\n${js('modulos/menu-inicial.js')}\n</script>`,
  '',
].join('\n');

const iHead = html.indexOf('</head>');
const iBody = html.lastIndexOf('</body>');
const saida = html.slice(0, iHead) + antesDoHead + html.slice(iHead, iBody) + antesDoBody + html.slice(iBody);

const destino = resolve(raiz, process.env.AURORA_SAIDA || 'www/index.html');
if (process.argv.includes('--verificar')) {
  if (!existsSync(destino) || sha(readFileSync(destino, 'utf8')) !== sha(saida)) { console.error('www/index.html está desatualizado. Rode: node ferramentas/montar.mjs'); process.exit(1); }
  console.log('www/index.html está em dia (' + marca + ').'); process.exit(0);
}
mkdirSync(dirname(destino), { recursive: true });
writeFileSync(destino, saida);
console.log(`www/index.html gerado — ${(saida.length / 1048576).toFixed(2)} MB — ${marca}`);
console.log(`original: ${sha(html).slice(0, 12)}  saída: ${sha(saida).slice(0, 12)}`);
