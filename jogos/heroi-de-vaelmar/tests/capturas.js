// Uso: node tests/capturas.js [prefixo] [arquivo.html]  -> grava tests/saida/<prefixo>-<tela>.png
const fs = require('fs'), path = require('path');
const { abrir, foto, painel, fecharPainel, batalha, RAIZ } = require('./lib');

(async () => {
  const prefixo = process.argv[2] || 'atual';
  const arquivo = process.argv[3] || undefined;
  const saida = path.join(RAIZ, 'tests', 'saida'); fs.mkdirSync(saida, { recursive: true });
  const { browser, page, erros, rede } = await abrir({ arquivo });
  const f = n => foto(page, path.join(saida, `${prefixo}-${n}.png`));
  await f('mundo');
  for (const [sel, nome] of [['main', 'menu'], ['items', 'itens'], ['quests', 'missoes'], ['codex', 'codex'], ['map', 'mapa']]) {
    await painel(page, sel); await f(nome); await fecharPainel(page);
  }
  await batalha(page); await f('batalha');
  console.log(JSON.stringify({ errosDeScript: erros, requisicoesExternas: rede }));
  await browser.close();
})();
