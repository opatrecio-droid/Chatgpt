// Percorre os três caminhos de classe e confere que todas as classes da árvore existem no catálogo.
const fs = require('fs'), path = require('path');
const { abrir, foto, RAIZ } = require('./lib');
(async () => {
  const saida = path.join(RAIZ, 'tests', 'saida'); fs.mkdirSync(saida, { recursive: true });
  const { browser, page, erros } = await abrir({});
  await page.evaluate(() => openPanel('classes')); await page.waitForTimeout(900);
  const verificacao = await page.evaluate(() => Object.fromEntries(Object.keys(PATHS).map(p => [p, PATHS[p].tiers.map(t => t.map(k => CLASSES[k]?.n))])));
  for (const d of [1, 1]) {
    await page.locator('.cp-bar button[data-d="1"]').tap(); await page.waitForTimeout(700);
    const p = await page.evaluate(() => P.path); await foto(page, path.join(saida, `caminho-${p}.png`));
  }
  await page.evaluate(() => { document.getElementById('sheet-scroll').scrollTop = 99999; }); await page.waitForTimeout(500);
  await foto(page, path.join(saida, 'caminho-fim.png'));
  await page.locator('.cp-card').first().tap(); await page.waitForTimeout(600); await foto(page, path.join(saida, 'caminho-detalhe.png'));
  console.log(JSON.stringify({ erros, verificacao }, null, 0));
  await browser.close();
})();
