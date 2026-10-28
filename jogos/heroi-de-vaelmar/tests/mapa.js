// Captura o mapa-múndi com névoa: depois de andar um pouco e com mais áreas reveladas.
const fs = require('fs'), path = require('path');
const { abrir, foto, painel, RAIZ } = require('./lib');
(async () => {
  const saida = path.join(RAIZ, 'tests', 'saida'); fs.mkdirSync(saida, { recursive: true });
  const { browser, page, erros } = await abrir({});
  await page.waitForTimeout(500);
  await painel(page, 'map'); await page.waitForTimeout(800); await foto(page, path.join(saida, 'mapa-inicio.png'));
  await page.evaluate(() => closePanel());
  // anda até outra cidade para revelar mais
  await page.evaluate(() => { const p = POI.svarga; H.x = p.tx * TILE; H.y = p.ty * TILE + 60; });
  await page.waitForTimeout(900);
  await painel(page, 'map'); await page.waitForTimeout(800); await foto(page, path.join(saida, 'mapa-depois.png'));
  await page.locator('#mp-tab').tap(); await page.waitForTimeout(300); await foto(page, path.join(saida, 'mapa-lista.png'));
  const salvo = await page.evaluate(() => { save(); return (JSON.parse(localStorage.getItem('aethric-offline-v4') || localStorage.getItem('aethric-offline-v3') || '{}').explored || '').length; });
  console.log(JSON.stringify({ erros, bytesExplorados: salvo }));
  await browser.close();
})();
