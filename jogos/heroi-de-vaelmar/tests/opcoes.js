// Opções: abas, joystick que move o herói, modo canhoto e FPS.
const fs = require('fs'), path = require('path');
const { abrir, foto, painel, fecharPainel, RAIZ } = require('./lib');
(async () => {
  const saida = path.join(RAIZ, 'tests', 'saida'); fs.mkdirSync(saida, { recursive: true });
  const { browser, page, erros } = await abrir({});
  const f = n => foto(page, path.join(saida, `opcoes-${n}.png`));
  await page.evaluate(() => openPanel('settings')); await page.waitForTimeout(700); await f('jogo');
  await page.locator('input[name="control"][value="joystick"]').check(); await page.locator('input[data-op="lefty"]').check(); await page.waitForTimeout(300);
  await page.evaluate(() => closePanel()); await page.waitForTimeout(500);
  const antes = await page.evaluate(() => ({ x: H.x, y: H.y, joy: !document.getElementById('joy').hidden }));
  const caixa = await page.locator('#joy').boundingBox();
  const cx = caixa.x + caixa.width / 2, cy = caixa.y + caixa.height / 2;
  await page.evaluate(([x, y, w]) => { const j = document.getElementById('joy'); const ev = (t, dx) => j.dispatchEvent(new PointerEvent(t, { pointerId: 7, clientX: x + dx, clientY: y, bubbles: true })); j.setPointerCapture = () => {}; j.hasPointerCapture = () => true; ev('pointerdown', 0); ev('pointermove', w * .45); window.__ev = ev; }, [cx, cy, caixa.width]);
  await page.waitForTimeout(1200); await f('mundo-joystick');
  const depois = await page.evaluate(() => { __ev('pointerup', 0); return { x: H.x, y: H.y }; });
  await page.evaluate(() => { OPCOES.fps = true; }); await page.waitForTimeout(1300);
  const fps = await page.evaluate(() => document.getElementById('fps').textContent);
  await page.evaluate(() => openPanel('settings', 'personagem')); await page.waitForTimeout(500); await f('personagem');
  console.log(JSON.stringify({ erros, antes, depois, moveu: depois.x > antes.x + 20, fps }));
  await browser.close();
})();
