// Capturas dos guardas do portão norte. Uso: node tools/guardas-shots.js <arquivo.html> <prefixo>
// Gera <prefixo>-dia-1..6 (1 s entre elas), <prefixo>-heroi-1..3 (herói passando perto do portão),
// <prefixo>-noite-1..2 (tocha). Imprime, a cada foto, posição, direção e fala dos guardas.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [fileArg, out] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 430, height: 860 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
  await p.goto('file://' + path.resolve(fileArg)); await p.waitForFunction(() => window.G && G.UI && G.R, null, { timeout: 60000 });
  await p.waitForTimeout(400); await p.click('[data-a="t-new"]'); await p.waitForTimeout(1500);
  await p.waitForFunction(() => Array.isArray(G.guards) && G.guards.length === 4, null, { timeout: 10000 });

  const cam = () => p.evaluate(() => {
    G.UI.closeModal(); G.UI.close(); G.R.follow = 0; G.S.clock = 10 * 60;
    G.R.focus(44, 40, true); G.R.cam.zf = 4; G.R.cam.z = 4;
  });
  const log = () => p.evaluate(() => G.guards
    .filter(g => Math.hypot(g.x - 44, g.y - 39.2) < 6)
    .map(g => `${g.id} (${g.x.toFixed(1)},${g.y.toFixed(1)}) dir${g.dir} ${g.moving ? 'andando' : 'parado'}${g.swing > 0 ? ' golpe' : ''}${g._al ? ' alerta' : ''}${g.say ? ' "' + g.say + '"' : ''}`)
    .join(' | '));
  const clip = { x: 65, y: 230, width: 300, height: 400 };
  const shot = async (name) => { await p.screenshot({ path: out + '-' + name + '.png', clip }); console.log(name + ': ' + await log()); };

  await cam(); await p.waitForTimeout(800);
  for (let i = 1; i <= 6; i++) { await shot('dia-' + i); await p.waitForTimeout(1000); }

  await p.waitForFunction(() => G.guards.every(g => !(g._cd > 0)), null, { timeout: 20000 });   // espera o cooldown da continência
  await p.evaluate(() => {
    const h = G.S.heroes[0]; h.inside = false; h.x = 43.6; h.y = 38.4; h.path = null;
    G.R.focus(44, 40, true);
  });
  for (let i = 1; i <= 3; i++) { await p.waitForTimeout(250); await shot('heroi-' + i); }

  await p.evaluate(() => { G.S.clock = 23 * 60; G.R.focus(44, 40, true); });
  await p.waitForTimeout(900);
  for (let i = 1; i <= 2; i++) { await shot('noite-' + i); await p.waitForTimeout(600); }

  console.log(errs.slice(0, 10).join('\n') || 'sem erros'); await b.close();
})();
