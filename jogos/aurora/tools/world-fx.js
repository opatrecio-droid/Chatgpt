// Testa as animações no mapa: aproxima um monstro do herói e enfileira habilidades pelo núcleo.
// Uso: node tools/world-fx.js <arquivo.html> <prefixo> <chave1,chave2,...> [instante_s=0.3]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const file = path.resolve(process.argv[2]), out = process.argv[3], keys = (process.argv[4] || 'base:esp').split(','), at = Number(process.argv[5] || 0.3);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 430, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 300)); });
  await page.goto('file://' + file);
  await page.waitForFunction(() => window.G && G.M && G.UI && G.A && G.A.SkillFX, null, { timeout: 60000 });
  await page.waitForTimeout(400);
  await page.click('[data-a="t-new"]');
  await page.waitForTimeout(1500);
  await page.evaluate(() => { G.UI.closeModal(); G.UI.close(); });
  for (const key of keys) {
    const ok = await page.evaluate((key) => {
      const FX = G.A.SkillFX, info = FX.info(key), S = G.S;
      const h = S.heroes.find(x => x.cls === info.cls) || S.heroes[0];
      const m = G.mons.find(o => !o.dead && !o.gone); if (!m) return 'sem monstro';
      const others = G.mons.filter(o => o !== m && !o.dead && !o.gone).slice(0, 2);
      const d = info.ranged ? 4 : 1.3; m.x = h.x + d; m.y = h.y; others.forEach((o, i) => { o.x = m.x + 0.8 + i * 0.3; o.y = m.y + (i ? 0.7 : -0.7); });
      G.R.focus(h.x + d / 2, h.y, true); S.speed = 1;
      FX.events.length = 0; FX.queue(key, h, m, G.mons); return 'ok';
    }, key);
    await page.waitForTimeout(at * 1000);
    await page.screenshot({ path: out + '-' + key.replace(':', '_') + '.png', clip: { x: 0, y: 250, width: 430, height: 400 } });
    console.log(key, ok);
  }
  console.log(errors.slice(0, 10).join('\n') || 'sem erros');
  await browser.close();
})();
