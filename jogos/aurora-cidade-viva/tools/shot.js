/* Captura de tela do jogo montado. Uso: node tools/shot.js <saida.png> [largura] [altura] [espera_ms] [js a executar antes] */
const path = require('path'); const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2], w = +process.argv[3] || 390, h = +process.argv[4] || 844, wait = +process.argv[5] || 3000, pre = process.argv[6] || '';
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: w < 600 ? 2 : 1, isMobile: w < 600, hasTouch: w < 600 });
  p.on('pageerror', (e) => console.log('ERRO', e.message)); p.on('console', (m) => { if (m.type() === 'error') console.log('console:', m.text()); });
  await p.goto('file://' + path.join(__dirname, '..', 'aurora-cidade-viva-19.html') + (process.env.Q || ''));
  await p.waitForTimeout(1500);
  if (pre) await p.evaluate(pre);
  await p.waitForTimeout(wait);
  await p.screenshot({ path: out }); await b.close(); console.log('ok', out);
})();
