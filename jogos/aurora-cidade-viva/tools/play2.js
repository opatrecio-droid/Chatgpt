/* Cenários forçados: evento, Maré, Fenda, queda, noite, salvar/carregar e desktop.
   Uso: node tools/play2.js <pasta_saida> */
const path = require('path'); const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2] || '/tmp';
  const b = await chromium.launch();
  const errs = [];
  const mk = async (w, h) => { const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 600 ? 2 : 1, isMobile: w < 600, hasTouch: w < 600 }); const p = await ctx.newPage(); p.on('pageerror', (e) => errs.push('ERRO ' + e.message + ' @ ' + (e.stack || '').split('\n')[1])); p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); }); await p.goto('file://' + path.join(__dirname, '..', 'aurora-cidade-viva-19.html')); await p.waitForTimeout(1500); return p; };
  const shot = (p, n) => p.screenshot({ path: path.join(out, 'q-' + n + '.png') });
  const start = async (p) => { await p.click('[data-a="t-new"]'); await p.waitForTimeout(900); await p.click('[data-a="tskip"]'); await p.waitForTimeout(400); };

  let p = await mk(390, 844); await start(p);
  /* evento */
  await p.evaluate(() => { G.S.day = 5; G.S.ev.next = 5; G.eventRoll(); }); await p.waitForTimeout(500); await shot(p, '01-evento');
  await p.click('[data-a="evopt:0"]').catch(() => errs.push('evopt falhou')); await p.waitForTimeout(400);
  /* avanço rápido: 6 dias simulados sem tela para ter um reino no meio do jogo */
  const fast = await p.evaluate(() => { const t0 = performance.now(); G.AUTO = true; G.S.gold += 4000; for (const id of ['enfermaria', 'ferraria', 'alquimista', 'lenharia', 'pedreira']) G.upgrade(id); for (let i = 0; i < 6 * 300 * 10; i++) { G.tick(0.1); if (i % 80 === 0) { for (const h of G.S.heroes) { const c = G.CLASSES[h.cls]; for (const t of [c.w, c.a]) if (G.canCraft(t, 1, false).ok && !G.S.inv.some((x) => x.type === t)) G.craft(t, 1, false, true); } } } G.AUTO = false; G.fx.length = 0; return { ms: Math.round(performance.now() - t0), dia: G.S.day, reino: G.S.realm.lvl, lv: G.S.heroes.map((h) => h.lvl), quedas: G.S.stats.falls, ouro: Math.round(G.S.gold) }; });
  console.log('avanço de 6 dias:', JSON.stringify(fast));
  await p.waitForTimeout(600); await shot(p, '02-dia7');
  await p.click('#nav-reino'); await p.waitForTimeout(400); await shot(p, '03-reino-geral'); await p.evaluate(() => { document.querySelector('#sheet .sh-body').scrollTop = 900; }); await p.waitForTimeout(300); await shot(p, '04-livro-caixa'); await p.click('#sheet [data-a="close"]');
  /* noite */
  await p.evaluate(() => { G.S.clock = 1385; G.R.follow = 0; G.R.focus(44, 50, true); G.S.speed = 1; }); await p.waitForTimeout(2500); await shot(p, '05-noite');
  /* Maré */
  await p.evaluate(() => { G.S.realm.lvl = Math.max(4, G.S.realm.lvl); G.mareStart(); G.S.speed = 3; const g = G.GATES[G.S.mare.active.gate]; G.R.focus(g.x, g.y + (G.S.mare.active.gate === 'n' ? 2 : -2), true); }); await p.waitForTimeout(9000); await shot(p, '06-mare');
  await p.waitForTimeout(25000); await shot(p, '07-mare-fim');
  await p.click('[data-a="mclose"]').catch(() => {}); await p.waitForTimeout(300);
  /* queda e recuperação */
  await p.evaluate(() => { const h = G.S.heroes[0]; G.R.follow = h.id; G.heroFall(h, null); }); await p.waitForTimeout(1200); await shot(p, '08-queda');
  /* Fenda */
  await p.evaluate(() => { G.S.realm.lvl = Math.max(5, G.S.realm.lvl); G.S.mare.active = null; const ids = G.S.heroes.filter((h) => h.state !== 'fallen' && h.state !== 'recover').map((h) => h.id); G.riftStart(ids); G.R.follow = 0; G.R.focus(12, 90, true); G.S.speed = 3; }); await p.waitForTimeout(26000); await shot(p, '09-fenda');
  /* salvar e recarregar */
  const before = await p.evaluate(() => { G.M.save(); return { dia: G.S.day, ouro: Math.round(G.S.gold), herois: G.S.heroes.length, reino: G.S.realm.lvl }; });
  await p.reload(); await p.waitForTimeout(1800); await shot(p, '10-titulo-continuar');
  await p.click('[data-a="t-continue"]'); await p.waitForTimeout(1200);
  const after = await p.evaluate(() => ({ dia: G.S.day, ouro: Math.round(G.S.gold), herois: G.S.heroes.length, reino: G.S.realm.lvl }));
  console.log('save:', JSON.stringify(before), '->', JSON.stringify(after)); await shot(p, '11-carregado');
  /* desempenho: quadros em 4 s */
  const fps = await p.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 4000) requestAnimationFrame(f); else res(Math.round(n / 4)); }; requestAnimationFrame(f); }));
  console.log('quadros por segundo (emulação de celular, sem GPU):', fps);
  await p.close();

  p = await mk(1366, 768); await start(p);
  await p.click('#nav-reino'); await p.waitForTimeout(500); await shot(p, '12-desktop');
  await p.click('#nav-herois'); await p.waitForTimeout(400); await p.click('.sh-body [data-a^="herod:"]'); await p.waitForTimeout(400); await shot(p, '13-desktop-heroi');
  console.log(errs.length ? errs.join('\n') : 'sem erros');
  await b.close();
})();
