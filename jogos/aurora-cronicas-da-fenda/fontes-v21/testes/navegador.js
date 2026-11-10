const { chromium } = require('playwright'); const path = require('path');
(async () => {
  const out = process.argv[3] || '.'; require('fs').mkdirSync(out, { recursive: true });
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').split('\n')[1])); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto('file://' + path.resolve(process.argv[2])); await p.waitForSelector('#title.on'); await p.click('[data-a="t-new"]'); await p.waitForTimeout(1000);
  for (let i = 0; i < 6; i++) { const s = await p.$('[data-a="tskip"]'); if (s) { await s.click(); await p.waitForTimeout(200); } }
  await p.waitForTimeout(700); await p.screenshot({ path: out + '/01-guia20.png' });
  let g = await p.$('#modal.on [data-a="mclose"]'); if (g) await g.click(); await p.waitForTimeout(700); await p.screenshot({ path: out + '/02-guia21.png' });
  g = await p.$('#modal.on [data-a="mclose"]'); if (g) await g.click();
  await p.evaluate(() => {
    const S = G.S; S.gold = 5e6; S.selos = 80; S.nucleos = 40; S.realm.lvl = 15;
    for (const k in G.RES) S.res[k] = (S.res[k] || 0) + (G.RES[k].emb ? 6 : 400);
    for (const id of G.BLD_IDS) S.b[id] = { lvl: id === 'cidadela' ? 6 : 5 };
    G.dirtyAll(); G.syncNpcs();
    const a = S.heroes[0]; a.lvl = 44; a.rank = 4; a._dirty = true;
    G.changeJob(a, 'duelista');
    for (const id of ['t_rubro', 't_lunar', 'a_fada', 'a_draco', 'p_raposa', 'p_gato', 'p_draquinho', 'a_pena', 't_guarda']) G.cosBuy(id);
    G.cosWear(a, 'traje', 't_rubro'); G.cosWear(a, 'asas', 'a_draco'); G.cosWear(a, 'pet', 'p_draquinho'); G.cosGrant('r_presa'); G.cosWear(a, 'reliquia', 'r_presa');
    G.cosWear(S.heroes[1], 'traje', 't_lunar'); G.cosWear(S.heroes[1], 'asas', 'a_fada'); G.cosWear(S.heroes[1], 'pet', 'p_raposa'); G.cosWear(S.heroes[2], 'asas', 'a_pena'); G.cosWear(S.heroes[2], 'pet', 'p_gato'); G.cosWear(S.heroes[2], 'traje', 't_guarda');
    for (const d of G.DECOR) G.buyDecor(d.id);
    G.emit('heroes'); S.paused = true; G.R.follow = 0; G.R.focus(44, 55, true);
  });
  const hid = await p.evaluate(() => G.S.heroes[0].id);
  const shot = async (n, fn, sc) => { await p.evaluate(fn); if (sc != null) await p.evaluate((y) => { document.querySelector('#sheet .sh-body').scrollTop = y; }, sc); await p.waitForTimeout(450); await p.screenshot({ path: out + '/' + n + '.png' }); };
  await shot('03-ficha', (0, eval)('(() => G.UI.open("herois", "lista", { hero: ' + hid + ' }))'));
  await p.click('.dside .ds.sp'); await p.waitForTimeout(400); await p.screenshot({ path: out + '/04-ateliê.png' });
  await p.evaluate(() => { document.querySelector('.mbox').scrollTop = 500; }); await p.waitForTimeout(200); await p.screenshot({ path: out + '/04b-ateliê.png' });
  await p.evaluate(() => G.UI.closeModal());
  await shot('05-habil', () => G.UI.act('htab', ['habil']), 380);
  await shot('06-artes', () => G.UI.act('htab', ['artes']), 900);
  await shot('07-caminhos', () => { G.UI.close(); G.UI.open('missoes', 'caminhos'); });
  await p.evaluate(() => G.UI.close()); await p.click('[data-a="diff"]'); await p.waitForTimeout(400); await p.screenshot({ path: out + '/08-dificuldade.png' });
  await p.click('[data-a="diffset:2"]'); await p.waitForTimeout(600); await p.screenshot({ path: out + '/09-hud-dificil.png' });
  await shot('10-decor', () => G.UI.open('reino', 'decor'), 150);
  // mover a estátua com toques reais no mapa
  await p.evaluate(() => { const el = document.querySelector('[data-a="decmove:estatua"]'); el.scrollIntoView({ block: 'center' }); }); await p.waitForTimeout(200);
  await p.click('[data-a="decmove:estatua"]'); await p.waitForTimeout(900); await p.screenshot({ path: out + '/11-movendo.png' });
  const before = await p.evaluate(() => JSON.stringify(G.decorSpots(G.DEC.estatua)));
  // toque num ladrilho livre (calcula a posição de tela do ladrilho 47,56)
  const pt = await p.evaluate(() => { const R = G.R; const a = R.screenToWorld(0, 0), b2 = R.screenToWorld(100, 100); const sx = 100 / (b2[0] - a[0]), sy = 100 / (b2[1] - a[1]); return [(47.5 - a[0]) * sx, (56.5 - a[1]) * sy]; });
  await p.touchscreen.tap(pt[0], pt[1]); await p.waitForTimeout(900);
  const after = await p.evaluate(() => JSON.stringify(G.decorSpots(G.DEC.estatua)) + ' placing=' + !!G.UI.placing + ' sheet=' + (G.UI.sheet && G.UI.sheet.tab));
  console.log('estátua', before, '→', after);
  await p.evaluate(() => { G.UI.close(); G.S.paused = false; G.S.speed = 1; G.R.focus(45, 55, true); G.R.setZoom(G.R.cam.zf * 1.5, 206, 457); G.S.heroes.slice(0, 3).forEach((h, i) => { h.state = 'idle'; h.until = 1e9; h.x = 42.5 + i * 2; h.y = 56.4; h.path = null; h.dir = i === 1 ? -1 : 1; }); });
  await p.waitForTimeout(1500); await p.screenshot({ path: out + '/12-praca.png' });
  await p.evaluate(() => { G.S.speed = 3; G.S.heroes.forEach((h) => { h.state = 'town'; h.until = 0; }); }); await p.waitForTimeout(8000);
  console.log(await p.evaluate(() => 'diff=' + G.S.diff + ' kills=' + G.S.stats.kills + ' ' + G.S.heroes.map((h) => h.state).join(',')));
  console.log('ERROS:', errs.length); for (const e of errs.slice(0, 6)) console.log(e);
  await b.close();
})();
