// Mundo à noite no celular e em tela larga.
const fs = require('fs'), path = require('path');
const { abrir, foto, RAIZ } = require('./lib');
(async () => {
  const saida = path.join(RAIZ, 'tests', 'saida'); fs.mkdirSync(saida, { recursive: true });
  let r = await abrir({ hora: '2026-10-28T12:35:00Z' });
  await r.page.waitForTimeout(800); await foto(r.page, path.join(saida, 'noite.png')); const e1 = r.erros; await r.browser.close();
  r = await abrir({ largura: 1366, altura: 768 });
  await r.page.waitForTimeout(800); await foto(r.page, path.join(saida, 'desktop-mundo.png'));
  await r.page.evaluate(() => { window.__b = battle({ foes: [makeFoe('rat', 4)], bio: 'grass' }); }); await r.page.waitForTimeout(1800);
  await foto(r.page, path.join(saida, 'desktop-combate.png'));
  console.log(JSON.stringify({ e1, e2: r.erros })); await r.browser.close();
})();
