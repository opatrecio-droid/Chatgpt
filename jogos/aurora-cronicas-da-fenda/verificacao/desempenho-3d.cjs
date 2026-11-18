/* Desempenho do 3D num perfil de celular: 390×844, tela 3×, CPU 6× mais lenta.
   Uso: node verificacao/desempenho-3d.cjs [file:///caminho/www/index.html] [lentidao=6]
   ATENÇÃO: sem GPU, o WebGL roda por software. Use para COMPARAR antes e depois de uma
   mudança, nunca como estimativa do que um celular de verdade vai entregar. */
const { chromium } = require('playwright');
const path = require('node:path');
const URL = process.argv[2] || 'file://' + path.resolve(__dirname, '../www/index.html');
const LENTO = Number(process.argv[3] || 6);
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 180)));
  await (await ctx.newCDPSession(p)).send('Emulation.setCPUThrottlingRate', { rate: LENTO });
  await p.goto(URL);
  await p.waitForSelector('.am-root', { timeout: 90000 });
  await p.click('[data-a="t-new"]');
  await p.waitForFunction(() => window.G && G.M && G.M.running, null, { timeout: 120000 });
  await p.waitForTimeout(5000);
  await p.evaluate(() => { G.S.tut.done = true; G.UI.closeAll(); G.UI.closeModal(); });
  const fps = (seg) => p.evaluate((seg) => new Promise((res) => {
    let n = 0, pior = 0, ult = performance.now(); const t0 = ult;
    const f = (agora) => { const d = agora - ult; ult = agora; if (n) pior = Math.max(pior, d); n++;
      if (agora - t0 < seg * 1000) requestAnimationFrame(f); else res({ fps: Math.round(n / ((agora - t0) / 1000)), piorQuadroMs: Math.round(pior) }); };
    requestAnimationFrame(f);
  }), seg);
  const heap = () => p.evaluate(() => (performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null));
  console.log(`perfil: 390×844, tela 3×, CPU ${LENTO}× mais lenta`);
  console.log('2D:', JSON.stringify(await fps(5)), 'heap', await heap(), 'MB');
  const t0 = Date.now();
  await p.evaluate(() => G.UI.act('vista3d'));
  await p.waitForFunction(() => G.RENDER.modo === '3d', null, { timeout: 90000 });
  console.log('troca 2D → 3D (primeira vez):', Date.now() - t0, 'ms');
  /* A rede de segurança voltaria ao 2D no meio da medida neste perfil lento; desligada só aqui. */
  await p.evaluate(() => { G.R3D.cfg.engasgosParaDesistir = 1e9; });
  await p.waitForTimeout(2500);
  console.log('3D:', JSON.stringify(await fps(5)), 'heap', await heap(), 'MB');
  console.log('canvas 3D:', JSON.stringify(await p.evaluate(() => { const e = G.R3D.estado(); return { largura: e.cw, altura: e.ch, sprites: e.sprites, grupos: e.lotes }; })));
  await p.evaluate(() => G.R3D.medir(true));
  await p.waitForTimeout(6000);
  console.log('tempo médio por quadro, por etapa (ms):', JSON.stringify(await p.evaluate(() => G.R3D.medida())));
  const eng = await p.evaluate(() => G.R3D.engasgos());
  console.log('engasgos acumulados:', eng, eng >= 45 ? '→ em jogo, a rede de segurança teria voltado ao 2D (desligada durante a medida)' : '(a rede de segurança volta ao 2D em 45)');
  console.log('modo no fim:', await p.evaluate(() => G.RENDER.modo));
  console.log('erros de página:', errs.length ? errs : 'nenhum');
  await b.close();
})().catch((e) => { console.error('ERRO', e.message); process.exit(1); });
