// Estados especiais do combate: mana baixa (atalho de poção), efeito de status, lista de habilidades, lista de combatentes.
const fs = require('fs'), path = require('path');
const { abrir, foto, RAIZ } = require('./lib');
(async () => {
  const saida = path.join(RAIZ, 'tests', 'saida'); fs.mkdirSync(saida, { recursive: true });
  const { browser, page, erros } = await abrir({});
  const f = n => foto(page, path.join(saida, `estado-${n}.png`));
  await page.evaluate(() => { window.__b = battle({ foes: [makeFoe('rat', 4), makeFoe('rat', 3)], bio: 'grass' }); });
  await page.waitForTimeout(1800);
  await page.evaluate(() => { B.hero.mp = 5; Rules.applyEffect(B.hero, 'Stunned', 1); Rules.applyEffect(B.foes[0], 'Poisoned', 1); renderParty(); });
  await page.waitForTimeout(600); await f('1-mana-baixa');
  await page.locator('#bt-qbtn').tap(); await page.waitForTimeout(400); await f('2-lista'); await page.locator('#bt-qbtn').tap();
  await page.locator('#cmds .bt-cmd', { hasText: /habilidade/i }).first().tap(); await page.waitForTimeout(500); await f('3-habilidades');
  await page.locator('#cmds .back').first().tap(); await page.waitForTimeout(300);
  await page.locator('#cmds .bt-cmd', { hasText: /^item/i }).first().tap(); await page.waitForTimeout(500); await f('4-itens');
  console.log(JSON.stringify({ erros }));
  await browser.close();
})();
