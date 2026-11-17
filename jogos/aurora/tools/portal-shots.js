// Capturas do Portal de Aurora no mapa: composição, close-ups de dia, de noite e durante a invocação.
// Uso: node tools/portal-shots.js <arquivo.html> <prefixo>
// Gera <prefixo>-cena.png (zoom normal), -dia-a/-dia-b (close, 0,35 s de diferença), -noite, -invoca-1/-2/-3.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [fileArg, out] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 430, height: 860 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
  await p.goto('file://' + path.resolve(fileArg)); await p.waitForFunction(() => window.G && G.UI && G.R, null, { timeout: 60000 });
  await p.waitForTimeout(400); await p.click('[data-a="t-new"]'); await p.waitForTimeout(1500);
  const cam = (z, dy) => p.evaluate(([z, dy]) => { G.UI.closeModal(); G.UI.close(); const W = G.W; G.R.follow = 0; G.R.focus(W.portal.x, W.portal.y + dy, true); G.R.cam.zf = z; G.R.cam.z = z; }, [z, dy]);
  const clip = { x: 65, y: 230, width: 300, height: 330 };
  await cam(3, 1); await p.waitForTimeout(900); await p.screenshot({ path: out + '-cena.png' });
  await cam(6, -1.4); await p.waitForTimeout(900); await p.screenshot({ path: out + '-dia-a.png', clip });
  await p.waitForTimeout(350); await p.screenshot({ path: out + '-dia-b.png', clip });
  await p.evaluate(() => { G.S.clock = 23 * 60; }); await p.waitForTimeout(700); await p.screenshot({ path: out + '-noite.png', clip });
  await p.evaluate(() => { G.S.clock = 12 * 60; if (G.A.portalBurst) G.A.portalBurst(); });
  for (const [i, ms] of [[1, 150], [2, 350], [3, 700]]) { await p.waitForTimeout(i === 1 ? ms : ms - [0, 150, 350][i - 1]); await p.screenshot({ path: out + '-invoca-' + i + '.png', clip }); }
  console.log(errs.slice(0, 10).join('\n') || 'sem erros'); await b.close();
})();
