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
  await p.evaluate(() => { G.S.speed = 2; }); await p.waitForTimeout(3000);
  await cam(74.5, 27.5, 2.6); await snap('cena2');
  /* um animal e um fruto de perto */
  const near = await p.evaluate(() => { const B = G.bosque; const f = B.fr.find(f => f.st === 'ground'); const a = B.an.find(a => a.sp === 'deer'); return { f: f && [f.x, f.y], a: a && [a.x, a.y], st: B.an.map(a => a.sp + ':' + a.st).join(' '), fr: B.fr.length, ft: B.ft.length }; });
  console.log(JSON.stringify(near));
  if (near.f) { await cam(near.f[0], near.f[1] - 1.2, 5); await p.waitForTimeout(300); await snap('fruta-1'); }
  if (near.a) { await cam(near.a[0], near.a[1] - 0.5, 5); await p.waitForTimeout(300); await snap('animais-1'); }
  /* cenário determinístico: 1.º um cervo pastando a ~5 tiles de Zeno (javali ainda protegido), depois um javali pastando a ~5 tiles (cervos protegidos) */
  const setup = (kind) => p.evaluate((kind) => {
    const B = G.bosque, z = G.npcs.find(n => n.name === 'Zeno');
    B.cd = 0; G.S.clock = 9 * 60 + 5; z.x = 73.5; z.y = 29.8; z.inside = false; z.path = null; z.moving = false;
    for (const a of B.an) if (a.sp !== 'bird') { a.gone = true; }
    const put = (sp, sex, ang) => { for (let d = 5; d < 7; d += 0.25) for (let k = 0; k < 16; k++) { const A = ang + k * 0.4, x = z.x + Math.cos(A) * d, y = z.y + Math.sin(A) * d; if (B.ok(x, y)) { const a = B.spawn(sp, sex, 2, x, y); a.st = 'graze'; a.tEnd = 999; a.t = 0; return a; } } return null; };
    if (kind === 'deer') { put('deer', 'm', -0.5); put('deer', 'f', 0.3); put('deer', 'f', 1.0); put('boar', 'f', 3); put('boar', 'm', 3.6); }
    else { put('deer', 'm', -0.5); put('deer', 'f', 0.3); put('boar', 'f', 0.6); put('boar', 'm', 1.2); put('boar', 'm', 1.8); }
    return B.an.filter(a => !a.gone).map(a => a.sp + ':' + Math.hypot(a.x - z.x, a.y - z.y).toFixed(1)).join(' ');
  }, kind);
  const grab = () => p.evaluate(() => ({ couro: G.S.res.couro || 0, refeicao: G.S.res.refeicao || 0, presa: G.S.res.presa || 0 }));
  const res0 = await grab(); console.log('recursos antes', JSON.stringify(res0));
  await p.evaluate(() => { G.S.speed = 3; });
  const deliveries = [];
  for (const kind of ['deer', 'boar']) {
    console.log('cenário', kind, await setup(kind));
    const before = await grab(), t0 = await p.evaluate(() => G.S.t), seen = {}; let d0 = await p.evaluate(() => G.bosque.stats.delivered), tries = 0, dn = 0;
    while (tries++ < 1500 && !dn) {
      const st = await p.evaluate(() => { const B = G.bosque, H = B.hunt, z = G.npcs.find(n => n.name === 'Zeno'); return { ph: H && H.ph, x: z.x, y: z.y, d: B.stats.delivered, sp: H && H.prey && H.prey.sp, s: B.stats.shot, h: B.stats.hit }; });
      if (['aim', 'loose', 'carry', 'drop'].includes(st.ph) && !seen[st.ph]) { seen[st.ph] = 1; await cam(st.x, st.y - 0.4, 5); await p.waitForTimeout(60); await snap('caca-' + kind + '-' + st.ph); }
      if (st.ph) await cam(st.x, st.y - 0.4, 4.5);
      if (st.d > d0) dn = 1;
      await p.waitForTimeout(80);
    }
    const t1 = await p.evaluate(() => G.S.t), after = await grab(), s = await p.evaluate(() => G.bosque.stats);
    deliveries.push({ kind, entregue: !!dn, segundosDeJogo: +(t1 - t0).toFixed(1), tiros: s.shot, acertos: s.hit, ganho: { couro: after.couro - before.couro, refeicao: after.refeicao - before.refeicao, presa: after.presa - before.presa } });
  }
  console.log('entregas:', JSON.stringify(deliveries));
  console.log('recursos depois', JSON.stringify(await grab()));
  await p.evaluate(() => { G.S.speed = 1; });
  const info = await p.evaluate(() => ({ stats: G.bosque.stats, an: G.bosque.an.map(a => a.sp + (a.age < 1 ? '*' : '') + ':' + a.st).join(' '), fr: G.bosque.fr.length, log: G.S.log.slice(-4).map(l => l.m) }));
  console.log(JSON.stringify(info));
  await p.evaluate(() => { G.S.clock = 23 * 60; }); await cam(74.5, 27.5, 2.6); await p.waitForTimeout(800); await snap('noite');
  console.log(errs.slice(0, 10).join('\n') || 'sem erros'); await b.close();
})();
