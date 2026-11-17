// Uso: node tools/shots.js <arquivo.html> <prefixo-saida> [cenas...]
// Cenas: habil (aba Habilidades do 1º herói), ferreiro (UI.e2Forge), mundo (combate), job (modal de vocação)
// Inicia uma jornada nova, recarrega o Campo de Treino/Ferraria e captura telas. Imprime erros de página.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const file = path.resolve(process.argv[2]);
  const out = process.argv[3] || 'shot';
  const scenes = process.argv.slice(4).length ? process.argv.slice(4) : ['habil', 'ferreiro'];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 300)); });
  await page.goto('file://' + file);
  await page.waitForFunction(() => window.G && G.M && G.UI && G.UI.ACT, null, { timeout: 60000 });
  await page.waitForTimeout(500);
  await page.click('[data-a="t-new"]');
  await page.waitForTimeout(1500);
  // Fecha modais iniciais; opcional: SETUP=js executa código de preparação (ex.: dar vocações)
  await page.evaluate(() => { try { G.UI.closeModal(); } catch (e) {} });
  if (process.env.SETUP) await page.evaluate(process.env.SETUP);
  await page.waitForTimeout(300);
  for (const sc of scenes) {
    if (sc === 'habil') {
      await page.evaluate(() => { const h = G.S.heroes[0]; G.UI.open('herois', 'lista', { hero: h.id, ht: 'habil' }); });
      await page.waitForTimeout(400);
      // tenta a aba Habilidades caso o open não tenha selecionado
      await page.evaluate(() => { const b = document.querySelector('[data-a="htab:habil"]'); if (b && !b.classList.contains('on')) b.click(); });
      await page.waitForTimeout(1200);
      await page.screenshot({ path: out + '-habil.png' });
      await page.evaluate(() => { for (const b of document.querySelectorAll('#sheet *')) if (b.scrollHeight > b.clientHeight + 20) b.scrollTop = 99999; });
      await page.waitForTimeout(600);
      await page.screenshot({ path: out + '-habil2.png' });
    } else if (sc === 'job') {
      await page.evaluate(() => { const h = G.S.heroes[0]; G.UI.open('herois', 'lista', { hero: h.id, ht: 'habil' }); });
      await page.waitForTimeout(400);
      await page.evaluate(() => { const b = document.querySelector('[data-a^="job:"]'); if (b) b.click(); });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: out + '-job.png' });
      await page.evaluate(() => G.UI.closeModal());
    } else if (sc === 'ferreiro') {
      await page.evaluate(() => { try { G.UI.close(); } catch (e) {} G.UI.act('e2forge', []); });
      await page.waitForTimeout(900);
      await page.screenshot({ path: out + '-ferreiro.png' });
      await page.evaluate(() => { const b = document.querySelector('#dock .dock-body, .dock-body, #dock'); if (b) b.scrollTop = 99999; });
      await page.waitForTimeout(400);
      await page.screenshot({ path: out + '-ferreiro2.png' });
    } else if (sc === 'mundo') {
      await page.evaluate(() => { try { G.UI.close(); G.UI.closeModal(); G.UI.dock && G.UI.dock.close && G.UI.dock.close(); } catch (e) {} });
      await page.evaluate(() => { const h = G.S.heroes[0]; G.R.focus(h.x, h.y, true); });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: out + '-mundo.png' });
    }
  }
  console.log(errors.slice(0, 15).join('\n') || 'sem erros');
  await browser.close();
})();
