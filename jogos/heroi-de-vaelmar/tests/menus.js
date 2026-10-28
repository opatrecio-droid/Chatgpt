// Captura menu principal, status, inventário e equipamento. Uso: node tests/menus.js [prefixo]
const fs = require('fs'), path = require('path');
const { abrir, foto, painel, fecharPainel, RAIZ } = require('./lib');
(async () => {
  const pre = process.argv[2] || 'menu';
  const saida = path.join(RAIZ, 'tests', 'saida'); fs.mkdirSync(saida, { recursive: true });
  const { browser, page, erros } = await abrir({});
  const f = n => foto(page, path.join(saida, `${pre}-${n}.png`));
  await painel(page, 'main'); await f('principal'); await fecharPainel(page);
  await page.evaluate(() => openPanel('hero', 'status')); await page.waitForTimeout(900); await f('status');
  await page.evaluate(() => { document.getElementById('sheet-scroll').scrollTop = 700; }); await page.waitForTimeout(300); await f('status2');
  await page.evaluate(() => { document.getElementById('sheet-scroll').scrollTop = 99999; }); await page.waitForTimeout(300); await f('status3');
  await page.evaluate(() => openPanel('hero', 'equip')); await page.waitForTimeout(900); await f('equip');
  await page.evaluate(() => { addItem('pocao_p', 3); S.bag.length || 0; openPanel('hero', 'inv'); }); await page.waitForTimeout(900);
  await page.locator('.cats button', { hasText: /Curativos/ }).first().tap(); await page.waitForTimeout(500); await f('inv-cura');
  await page.locator('.cats button', { hasText: /Armadura/ }).first().tap(); await page.waitForTimeout(500); await f('inv-armadura');
  console.log(JSON.stringify({ erros }));
  await browser.close();
})();
