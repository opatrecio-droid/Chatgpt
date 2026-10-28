// Percorre os três caminhos de classe e confere que todas as classes da árvore existem no catálogo.
const fs = require('fs'), path = require('path');
const { abrir, foto, RAIZ } = require('./lib');
(async () => {
  const saida = path.join(RAIZ, 'tests', 'saida'); fs.mkdirSync(saida, { recursive: true });
  const { browser, page, erros } = await abrir({});
  await page.evaluate(() => openPanel('classes')); await page.waitForTimeout(900);
  const verificacao = await page.evaluate(() => Object.fromEntries(Object.keys(PATHS).map(p => [p, PATHS[p].tiers.map(t => t.map(k => CLASSES[k]?.n))])));
  for (const d of [1, 1, 1]) {
    await page.locator('.cp-bar button[data-d="1"]').tap(); await page.waitForTimeout(700);
    const p = await page.evaluate(() => P.path); await foto(page, path.join(saida, `caminho-${p}.png`));
  }
  // quarto caminho: Valhala, última ponta (sem seta para a direita), começa no tier 3
  const v = await page.evaluate(() => ({ p: P.path, titulo: document.querySelector('.cp-title b')?.textContent, direita: document.querySelectorAll('.cp-bar button[data-d="1"]').length, nomes: [...document.querySelectorAll('.cp-card b')].slice(0, 8).map(b => b.textContent), niveis: [...document.querySelectorAll('.cp-tier .lv')].slice(0, 8).map(e => e.textContent) }));
  console.log(JSON.stringify(v));
  if (v.p !== 'valhala' || v.direita !== 0 || v.nomes[0] !== 'Treinador' || v.niveis[0] !== 'NÍVEL 50' || v.niveis[7] !== 'NÍVEL 225' || v.nomes[7] !== 'Beowulf') { console.log('FALHOU: caminho de Valhala'); process.exitCode = 1; }
  await page.locator('.cp-bar button[data-d="-1"]').tap(); await page.waitForTimeout(500);
  if (await page.evaluate(() => P.path) !== 'ladino') { console.log('FALHOU: voltar para o Ladrão'); process.exitCode = 1; }
  await page.locator('.cp-bar button[data-d="1"]').tap(); await page.waitForTimeout(500);
  await page.evaluate(() => { document.getElementById('sheet-scroll').scrollTop = 99999; }); await page.waitForTimeout(500);
  await foto(page, path.join(saida, 'caminho-fim.png'));
  await page.locator('.cp-card').first().tap(); await page.waitForTimeout(600); await foto(page, path.join(saida, 'caminho-detalhe.png'));
  console.log(JSON.stringify({ erros, verificacao }, null, 0));
  await browser.close();
})();
