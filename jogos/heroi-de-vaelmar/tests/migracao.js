// Gera um save na versão antiga (APK 4.4.0) e abre na nova. Uso: node tests/migracao.js <game-antigo.html>
const { chromium } = require('playwright');
const path = require('path');
const { RAIZ } = require('./lib');
(async () => {
  const velho = process.argv[2], novo = path.join(RAIZ, 'dist', 'game.html');
  const browser = await chromium.launch();
  // 1. cria o save na versão antiga
  let ctx = await browser.newContext({ viewport: { width: 393, height: 851 } }); let page = await ctx.newPage();
  await page.goto('file://' + velho); await page.waitForTimeout(2500);
  await page.getByText('Começar aventura').click(); await page.waitForTimeout(2500);
  const save = await page.evaluate(() => { S.lvl = 30; S.xp = 1234; S.gold = 98765; S.ess = 4321; S.hp = 99999; S.mp = 99999; addItem('pocao_p', 7); save(); return localStorage.getItem('aethric-offline-v4'); });
  await ctx.close();
  // 2. abre na versão nova com o mesmo save
  ctx = await browser.newContext({ viewport: { width: 393, height: 851 } });
  await ctx.addInitScript(s => { try { if (!localStorage.getItem('aethric-offline-v4')) localStorage.setItem('aethric-offline-v4', s); } catch {} }, save);
  page = await ctx.newPage(); const erros = []; page.on('pageerror', e => erros.push(String(e)));
  await page.goto('file://' + novo); await page.waitForTimeout(2800);
  await page.locator('#btn-continue').click({ timeout: 5000 }).catch(() => {}); await page.waitForTimeout(2000);
  const r = await page.evaluate(() => { const st = stats(); return { cur, lvl: S.lvl, gold: S.gold, hp: S.hp, maxhp: st.hp, mp: S.mp, maxmp: st.mp, pocao: S.inv.pocao_p, cls: S.cls }; });
  console.log(JSON.stringify({ r, erros, ok: r.cur === 'world' && r.lvl === 30 && r.gold === 98765 && r.hp <= r.maxhp && !erros.length }));
  await browser.close();
})();
