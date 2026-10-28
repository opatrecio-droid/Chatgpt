// Captura o mundo em vários pontos. Uso: node tests/mundo.js [prefixo] [largura] [altura]
const fs = require('fs'), path = require('path');
const { abrir, foto, RAIZ } = require('./lib');
(async () => {
  const pre = process.argv[2] || 'mundo', largura = +process.argv[3] || 393, altura = +process.argv[4] || 851;
  const saida = path.join(RAIZ, 'tests', 'saida'); fs.mkdirSync(saida, { recursive: true });
  const { browser, page, erros } = await abrir({ largura, altura });
  const f = n => foto(page, path.join(saida, `${pre}-${n}.png`));
  await page.waitForTimeout(800); await f('loton');
  const pontos = await page.evaluate(() => POIS.filter(p => ['loton', 'svarga', 'vinland', 'resting_place', 'lythryn'].includes(p.id)).map(p => [p.id, p.tx, p.ty]));
  for (const [id, tx, ty] of pontos.slice(1, 4)) {
    await page.evaluate(([x, y]) => { H.x = x * TILE + 16; H.y = y * TILE + 60; H.path = []; H.goal = null; }, [tx, ty]);
    await page.waitForTimeout(900); await f(id);
  }
  console.log(JSON.stringify({ erros, pontos }));
  await browser.close();
})();
