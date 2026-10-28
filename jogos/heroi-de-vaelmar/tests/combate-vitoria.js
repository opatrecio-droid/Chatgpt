// Joga uma batalha completa do mapa até a vitória e confere o retorno ao mundo.
const fs = require('fs'), path = require('path');
const { abrir, foto, RAIZ } = require('./lib');
(async () => {
  const saida = path.join(RAIZ, 'tests', 'saida'); fs.mkdirSync(saida, { recursive: true });
  const { browser, page, erros, rede } = await abrir({});
  await page.evaluate(() => { window.__b = startMapBattle(EX.mons[0]); });
  await page.waitForTimeout(2200);
  await page.evaluate(() => ACT.encounterfight());
  await page.waitForTimeout(2500);
  let passos = 0, vitoria = false;
  for (; passos < 60; passos++) {
    const cur = await page.evaluate(() => cur);
    if (cur === 'world') break;
    const resultado = page.locator('button[data-act="resultcontinue"]');
    if (await resultado.count() && await resultado.first().isVisible()) { vitoria = true; await foto(page, path.join(saida, 'vitoria.png')); await resultado.first().tap(); await page.waitForTimeout(1200); continue; }
    const atk = page.locator('#cmds .bt-cmd:not([disabled])', { hasText: /ataque/i });
    if (await atk.count()) { await atk.first().tap(); await page.waitForTimeout(250); const l = page.locator('#cmds.list .bt-cmd:not([disabled])').first(); if (await l.count()) await l.tap(); }
    await page.waitForTimeout(900);
  }
  const fim = await page.evaluate(() => ({ cur, gold: S.gold, xp: S.xp, hp: S.hp }));
  console.log(JSON.stringify({ passos, vitoria, fim, erros, rede }));
  await browser.close();
  process.exit(vitoria && fim.cur === 'world' && !erros.length ? 0 : 1);
})();
