// Capturas da Fazenda: celeiro, canteiros e trabalhadores (Joca e Lina).
// Uso: node tools/farm-shots.js <arquivo.html> <prefixo>
// Gera: -cena (celeiro + canteiros), -campo-1..4 (close dos canteiros a cada 0,25 s), -celeiro-1/2, -noite.
// Prepara: Fazenda nível 3 (Joca e Lina trabalham), 9h, canteiros em todos os estágios (0 a 4, alguns molhados),
// e os dois lavradores já no campo.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [fileArg, out] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 430, height: 860 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
  await p.goto('file://' + path.resolve(fileArg)); await p.waitForFunction(() => window.G && G.UI && G.R, null, { timeout: 60000 });
  await p.waitForTimeout(400); await p.click('[data-a="t-new"]'); await p.waitForTimeout(1500);
  await p.evaluate(() => {
    G.UI.closeModal(); G.UI.close(); G.R.follow = 0;
    G.S.b.fazenda = Object.assign(G.S.b.fazenda || {}, { lvl: 3, dmg: 0 }); G.S.clock = 9 * 60; if (G.syncNpcs) G.syncNpcs();
    const T = (G.life && G.life.tiles) || [];
    T.forEach((q, i) => { q.st = [4, 4, 3, 2, 1, 0, 4, 3][i % 8]; q.wet = q.st === 1 || i % 5 === 0 ? G.S.t + 999 : 0; q.owner = 0; });
    for (const n of G.npcs) if (n.at === 'fazenda' && n.wk) { n.x = 66.6 + (n.wk - 1) * 1.6; n.y = 60.3; n.inside = false; n.path = null; n.moving = false; }   // já no campo
  });
  await p.waitForTimeout(800);
  await p.evaluate(() => { G.S.speed = 2; });
  await p.waitForTimeout(3500);
  await p.evaluate(() => { G.S.speed = 1; });
  const cam = (x, y, z) => p.evaluate(([x, y, z]) => { G.R.follow = 0; G.R.focus(x, y, true); G.R.cam.zf = z; G.R.cam.z = z; }, [x, y, z]);
  await cam(67.5, 54.5, 3); await p.waitForTimeout(700); await p.screenshot({ path: out + '-cena.png' });
  await cam(67.5, 60.4, 6); await p.waitForTimeout(600);
  for (let i = 1; i <= 4; i++) { await p.screenshot({ path: out + '-campo-' + i + '.png' }); await p.waitForTimeout(250); }
  await cam(65.5, 46.6, 6); await p.waitForTimeout(600);
  await p.screenshot({ path: out + '-celeiro-1.png' }); await p.waitForTimeout(400); await p.screenshot({ path: out + '-celeiro-2.png' });
  const info = await p.evaluate(() => ({ workers: G.npcs.filter(n => n.at === 'fazenda').map(n => n.name + ':' + (n._wk ? (n.w && n.w.ph) : n.state) + '@' + n.x.toFixed(1) + ',' + n.y.toFixed(1)), tiles: (G.life && G.life.tiles || []).length, pile: G.life && G.life.pile && G.life.pile.fazenda }));
  await p.evaluate(() => { G.S.clock = 23 * 60; }); await cam(67.5, 54.5, 3); await p.waitForTimeout(800); await p.screenshot({ path: out + '-noite.png' });
  console.log(JSON.stringify(info));
  console.log(errs.slice(0, 10).join('\n') || 'sem erros'); await b.close();
})();
