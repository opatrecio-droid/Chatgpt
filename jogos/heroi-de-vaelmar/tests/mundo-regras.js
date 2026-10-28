// Regras de interação do mundo: aviso ao tocar num monstro longe, aviso de área bloqueada, obstáculos das construções.
const fs = require('fs'), path = require('path');
const { abrir, foto, RAIZ } = require('./lib');
(async () => {
  const saida = path.join(RAIZ, 'tests', 'saida'); fs.mkdirSync(saida, { recursive: true });
  const { browser, page, erros } = await abrir({});
  const r = {};
  // monstro longe
  await page.evaluate(() => { const m = EX.mons.find(m => Math.hypot(m.x - H.x, m.y - H.y) > 160) || EX.mons[0]; m.x = H.x + 200; m.y = H.y - 40; });
  await page.evaluate(() => { const m = EX.mons.find(m => Math.hypot(m.x - H.x, m.y - H.y) > 150); const c = cvW.getBoundingClientRect(); onTapWorld({ clientX: c.left + (m.x - EX.cam.x) / EX.vw * c.width, clientY: c.top + (m.y - 10 - EX.cam.y) / EX.vh * c.height }); });
  await page.waitForTimeout(400);
  r.bannerLonge = await page.evaluate(() => document.getElementById('w-banner').hidden ? null : document.getElementById('w-banner').textContent);
  await foto(page, path.join(saida, 'regra-longe.png'));
  // área bloqueada
  await page.evaluate(() => { const p = POIS.find(p => p.minLv > S.lvl); H.path = []; window.__t = p ? [p.tx * TILE, p.ty * TILE] : null; if (p) walkTo(p.tx * TILE, p.ty * TILE); });
  r.bannerBloqueada = await page.evaluate(() => document.getElementById('w-banner').hidden ? null : document.getElementById('w-banner').textContent);
  // construções bloqueiam
  r.blocos = await page.evaluate(() => { const b = EX.ents.find(e => e.bid); const [tx, ty] = tileOf(b.x, b.y - 8); return { bid: b.bid, tile: [tx, ty], andavel: walkTile(tx, ty) }; });
  console.log(JSON.stringify({ erros, ...r }));
  await browser.close();
})();
