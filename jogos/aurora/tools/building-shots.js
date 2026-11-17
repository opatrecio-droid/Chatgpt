// Capturas de um prédio de serviço animado. Uso: node tools/building-shots.js <arquivo.html> <prefixo> [id=ferraria]
// Gera <prefixo>-cena.png (zoom normal) e close-ups: -dia-1..8 (a cada 0,12 s), -noite, -forjando-1/2.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [fileArg, out, idArg] = process.argv.slice(2), id = idArg || 'ferraria';
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 430, height: 860 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
  await p.goto('file://' + path.resolve(fileArg)); await p.waitForFunction(() => window.G && G.UI && G.R, null, { timeout: 60000 });
  await p.waitForTimeout(400); await p.click('[data-a="t-new"]'); await p.waitForTimeout(1500);
  const cam = (z) => p.evaluate(([id, z]) => {
    G.UI.closeModal(); G.UI.close(); G.R.follow = 0; const pl = G.W.plots[id];
    if (!G.S.b[id] || !G.S.b[id].lvl) { G.S.b[id] = Object.assign(G.S.b[id] || {}, { lvl: 1 }); }
    G.S.clock = 12 * 60; G.R.focus(pl.x + 3, pl.y + 2.2, true); G.R.cam.zf = z; G.R.cam.z = z;
  }, [id, z]);
  await cam(3); await p.waitForTimeout(900); await p.screenshot({ path: out + '-cena.png' });
  await cam(6); await p.waitForTimeout(700);
  const clip = { x: 15, y: 130, width: 400, height: 470 };
  for (let i = 1; i <= 8; i++) { await p.screenshot({ path: out + '-dia-' + i + '.png', clip }); await p.waitForTimeout(120); }
  await p.evaluate(() => { G.S.clock = 23 * 60; }); await p.waitForTimeout(600); await p.screenshot({ path: out + '-noite.png', clip });
  await p.evaluate(() => { G.S.clock = 12 * 60; });
  await p.evaluate(() => { G.S.stats.crafted = (G.S.stats.crafted || 0) + 1; });
  await p.waitForTimeout(300); await p.screenshot({ path: out + '-forjando-1.png', clip });
  await p.waitForTimeout(260); await p.screenshot({ path: out + '-forjando-2.png', clip });
  console.log(errs.slice(0, 10).join('\n') || 'sem erros'); await b.close();
})();
