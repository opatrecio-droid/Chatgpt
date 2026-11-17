// Capturas do Bosque de caça: animais, frutos, Zeno e a caça completa.
// Uso: node tools/bosque-shots.js <arquivo.html> <prefixo>
// Gera: -sprites (folha dos animais), -cena (bosque), -fruta-1..2 (frutos caindo/no chão), -animais-N (close), -caca-<fase> (Zeno),
//       -noite. Prepara: Lenharia nível 2, Fazenda nível 2 (Zeno existe), 9h; Zeno já perto do bosque.
// Imprime: o que Zeno entregou (recursos antes/depois), estatísticas e "sem erros".
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const [fileArg, out] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 430, height: 860 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
  await p.goto('file://' + path.resolve(fileArg)); await p.waitForFunction(() => window.G && G.UI && G.R, null, { timeout: 60000 });
  await p.waitForTimeout(400); await p.click('[data-a="t-new"]'); await p.waitForTimeout(1500);
  await p.evaluate(() => {
    G.UI.closeModal(); G.UI.close(); G.R.follow = 0;
    G.S.b.lenharia = Object.assign(G.S.b.lenharia || {}, { lvl: 2, dmg: 0 }); G.S.b.fazenda = Object.assign(G.S.b.fazenda || {}, { lvl: 2, dmg: 0 });
    G.S.clock = 9 * 60; G.syncNpcs();
    const z = G.npcs.find(n => n.name === 'Zeno'); if (z) { z.x = 73.5; z.y = 31.5; z.inside = false; z.path = null; }
  });
  const sheet = await p.evaluate(() => G.bosque.sheet(8));
  fs.writeFileSync(out + '-sprites.png', Buffer.from(sheet.split(',')[1], 'base64'));
  const cam = (x, y, z) => p.evaluate(([x, y, z]) => { G.R.follow = 0; G.R.focus(x, y, true); G.R.cam.zf = z; G.R.cam.z = z; }, [x, y, z]);
  const snap = (n) => p.screenshot({ path: out + '-' + n + '.png' });
  await p.waitForTimeout(600);
  await cam(74.5, 27.5, 2.6); await p.waitForTimeout(500); await snap('cena');
  await p.evaluate(() => { G.S.speed = 3; }); await p.waitForTimeout(9000);
  await cam(74.5, 27.5, 2.6); await snap('cena2');
  /* um animal e um fruto de perto */
  const near = await p.evaluate(() => { const B = G.bosque; const f = B.fr.find(f => f.st === 'ground'); const a = B.an.find(a => a.sp === 'deer'); return { f: f && [f.x, f.y], a: a && [a.x, a.y], st: B.an.map(a => a.sp + ':' + a.st).join(' '), fr: B.fr.length, ft: B.ft.length }; });
  console.log(JSON.stringify(near));
  if (near.f) { await cam(near.f[0], near.f[1] - 1.2, 5); await p.waitForTimeout(300); await snap('fruta-1'); }
  if (near.a) { await cam(near.a[0], near.a[1] - 0.5, 5); await p.waitForTimeout(300); await snap('animais-1'); }
  const res0 = await p.evaluate(() => ({ couro: G.S.res.couro || 0, refeicao: G.S.res.refeicao || 0, presa: G.S.res.presa || 0 }));
  /* caça completa: acompanha as fases de Zeno */
  const seen = {}; let done = 0, tries = 0;
  while (tries++ < 400 && done < 1) {
    const st = await p.evaluate(() => { const B = G.bosque, H = B.hunt, z = G.npcs.find(n => n.name === 'Zeno'); return { ph: H && H.ph, x: z && z.x, y: z && z.y, d: B.stats.delivered, prey: H && H.prey && H.prey.sp, sc: z && z._sc }; });
    if (st.ph && !seen[st.ph] && ['stalk', 'aim', 'loose', 'lift', 'carry', 'drop'].includes(st.ph)) { seen[st.ph] = 1; await cam(st.x, st.y - 0.4, 5); await p.waitForTimeout(120); await snap('caca-' + st.ph); }
    if (st.ph && ['aim', 'loose', 'stalk', 'carry'].includes(st.ph)) await cam(st.x, st.y - 0.4, 4.5);
    if (st.d >= 1) done = 1;
    await p.waitForTimeout(250);
  }
  const res1 = await p.evaluate(() => ({ couro: G.S.res.couro || 0, refeicao: G.S.res.refeicao || 0, presa: G.S.res.presa || 0 }));
  console.log('fases vistas:', Object.keys(seen).join(','), '| recursos antes', JSON.stringify(res0), 'depois', JSON.stringify(res1));
  await p.evaluate(() => { G.S.speed = 1; });
  const info = await p.evaluate(() => ({ stats: G.bosque.stats, an: G.bosque.an.map(a => a.sp + (a.age < 1 ? '*' : '') + ':' + a.st).join(' '), fr: G.bosque.fr.length, log: G.S.log.slice(-4).map(l => l.m) }));
  console.log(JSON.stringify(info));
  await p.evaluate(() => { G.S.clock = 23 * 60; }); await cam(74.5, 27.5, 2.6); await p.waitForTimeout(800); await snap('noite');
  console.log(errs.slice(0, 10).join('\n') || 'sem erros'); await b.close();
})();
