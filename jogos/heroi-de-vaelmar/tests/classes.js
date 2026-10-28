// Captura a tela de classes (Caminhos) em várias rolagens. Uso: node tests/classes.js [prefixo]
const fs = require('fs'), path = require('path');
const { abrir, foto, RAIZ } = require('./lib');
(async () => {
  const pre = process.argv[2] || 'classes';
  const saida = path.join(RAIZ, 'tests', 'saida'); fs.mkdirSync(saida, { recursive: true });
  const { browser, page, erros } = await abrir({});
  await page.evaluate(() => openPanel('classes'));
  await page.waitForTimeout(1200);
  const alt = await page.evaluate(() => document.getElementById('sheet-scroll').scrollHeight);
  for (let i = 0; i < 4; i++) {
    await page.evaluate(i => { document.getElementById('sheet-scroll').scrollTop = i * 700; }, i);
    await page.waitForTimeout(500); await foto(page, path.join(saida, `${pre}-${i}.png`));
  }
  console.log(JSON.stringify({ alt, erros }));
  await browser.close();
})();
