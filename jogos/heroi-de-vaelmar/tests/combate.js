// Captura o combate em vários estados.
// Uso: node tests/combate.js [prefixo] [monstro|chefe]
const fs = require('fs'), path = require('path');
const { abrir, foto, RAIZ } = require('./lib');

async function iniciar(page, chefe) {
  await page.evaluate(chefe => {
    const key = chefe ? Object.keys(MON).find(k => MON[k].boss && /goblin/i.test(MON[k].n)) || Object.keys(MON).find(k => MON[k].boss) : 'rat';
    window.__b = battle({ foes: [makeFoe(key, chefe ? 8 : 4)], bio: 'grass', canFlee: !chefe });
  }, chefe);
  await page.waitForTimeout(1800);
}
async function ataque(page) {
  await page.locator('#cmds .bt-cmd', { hasText: /ataque/i }).first().tap();
  await page.waitForTimeout(300);
  const lista = page.locator('#cmds.list .bt-cmd').first();
  if (await lista.count()) await lista.tap();
}
(async () => {
  const prefixo = process.argv[2] || 'combate', chefe = process.argv[3] === 'chefe';
  const saida = path.join(RAIZ, 'tests', 'saida'); fs.mkdirSync(saida, { recursive: true });
  const { browser, page, erros, rede } = await abrir({});
  const f = n => foto(page, path.join(saida, `${prefixo}-${n}.png`));
  await iniciar(page, chefe); await f('1-inicio');
  await ataque(page); await page.waitForTimeout(700); await f('2-ataque');
  await page.waitForTimeout(2600); await f('3-resposta');
  await ataque(page); await page.waitForTimeout(3200); await f('4-turno2');
  console.log(JSON.stringify({ erros, rede, log: await page.evaluate(() => [...document.querySelectorAll('#b-log p')].map(p => p.textContent)) }));
  await browser.close();
})();
