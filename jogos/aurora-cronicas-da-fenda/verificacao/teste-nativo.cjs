/* Caminhos do Android com um bridge Capacitor SIMULADO: voltar, sair, compartilhar, tela ligada, 2º plano.
   Uso: node verificacao/teste-nativo.cjs [file:///caminho/www/index.html]  (sai com 1 se algo falhar) */
const { chromium } = require('playwright');
const URL = (process.argv[2] || 'file://' + require('node:path').resolve(__dirname, '../www/index.html'));
const ok = (c, m) => { if (!c) process.exitCode = 1; console.log((c ? 'PASS ' : 'FAIL ') + m); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await ctx.addInitScript(() => {
    const L = (window.__calls = []);
    const listeners = {};
    window.Capacitor = {
      isNativePlatform: () => true, getPlatform: () => 'android',
      Plugins: {
        App: { addListener: (ev, fn) => { listeners[ev] = fn; return Promise.resolve({ remove() {} }); }, exitApp: () => { L.push(['exitApp']); } },
        Filesystem: { writeFile: async (o) => { L.push(['writeFile', o.path, o.directory, o.encoding, o.data.length]); return { uri: 'file:///cache/' + o.path }; } },
        Share: { share: async (o) => { L.push(['share', o.title, o.url]); return {}; } },
        Plataforma: { manterTelaLigada: async (o) => { L.push(['tela', o.ligar]); }, imersivo: async (o) => { L.push(['imersivo', o.ligar]); } },
        Haptics: { vibrate: async () => {} },
      },
    };
    window.__fire = (ev, arg) => listeners[ev] && listeners[ev](arg);
  });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 300)));
  await p.goto(URL); await p.waitForSelector('.am-root', { timeout: 20000 });
  ok(await p.evaluate(() => AuroraPlatform.perfil === 'android' && AuroraPlatform.nativo), 'perfil android detectado pelo bridge');
  ok(await p.evaluate(() => document.documentElement.classList.contains('plat-android')), 'classe plat-android no <html>');
  ok(!!(await p.$('[data-a="am-sair"]')) && !(await p.$('[data-a="am-fs"]')), 'menu mostra "Sair" e não mostra tela cheia');
  ok(await p.evaluate(() => AuroraPlatform.cfg.teclas === undefined && AuroraPlatform.cfg.entrada.teclado === true && AuroraPlatform.cfg.entrada.mouse === true && AuroraPlatform.cfg.entrada.gamepad === true), 'android herda teclado/mouse/gamepad do PC');
  ok(await p.evaluate(() => AuroraPlatform.cfg.tela.dprCap === 2 && AuroraPlatform.cfg.audio.sfx === 0.7), 'android herda tela.dprCap e audio do PC');

  // voltar: com janela aberta → fecha; no título sem janela → avisa; segunda vez → sai
  await p.click('[data-a="am-config"]'); await p.waitForSelector('.am-modal');
  await p.evaluate(() => __fire('backButton', {})); await p.waitForTimeout(250);
  ok(await p.evaluate(() => !G.UI.modalOpen), 'botão voltar fecha a janela aberta');
  await p.evaluate(() => __fire('backButton', {})); await p.waitForTimeout(150);
  ok(await p.evaluate(() => !__calls.some(c => c[0] === 'exitApp')), '1º voltar no menu não sai');
  await p.evaluate(() => __fire('backButton', {})); await p.waitForTimeout(150);
  ok(await p.evaluate(() => __calls.some(c => c[0] === 'exitApp')), '2º voltar em 2 s sai do app');
  // botão Sair
  await p.evaluate(() => { __calls.length = 0; });
  await p.click('[data-a="am-sair"]'); await p.waitForSelector('[data-a="myes"]'); await p.click('[data-a="myes"]');
  ok(await p.evaluate(() => __calls.some(c => c[0] === 'exitApp')), 'botão Sair confirma e chama exitApp');

  // jogo: tela ligada + exportar via Share
  await p.click('[data-a="t-new"]'); await p.waitForTimeout(4500);
  ok(await p.evaluate(() => __calls.some(c => c[0] === 'tela' && c[1] === true)), 'ao iniciar o jogo liga a tela (plugin Plataforma)');
  await p.evaluate(() => { G.S.tut.done = true; G.UI.closeAll(); G.UI.closeModal(); });
  await p.evaluate(() => { __calls.length = 0; G.UI.ACT['save-file'](); });
  await p.waitForTimeout(300);
  const calls = await p.evaluate(() => __calls);
  ok(calls.some(c => c[0] === 'writeFile' && /^aurora-jornada-v.*\.txt$/.test(c[1]) && c[2] === 'CACHE' && c[3] === 'utf8') && calls.some(c => c[0] === 'share'), 'Exportar jornada usa Filesystem+Share → ' + JSON.stringify(calls));
  // pausa do app salva
  await p.evaluate(() => { window.__saved = 0; const o = G.M.save; G.M.save = function () { window.__saved++; return o.apply(this, arguments); }; __fire('appStateChange', { isActive: false }); });
  ok(await p.evaluate(() => __saved >= 1), 'app em segundo plano dispara salvamento');
  // voltar dentro do jogo = Esc (abre menu do jogo)
  await p.evaluate(() => __fire('backButton', {})); await p.waitForTimeout(400);
  ok(await p.evaluate(() => G.UI.modalOpen), 'voltar dentro do jogo abre o menu do jogo (Esc)');
  await p.evaluate(() => __fire('backButton', {})); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !G.UI.modalOpen), 'voltar de novo fecha o menu do jogo');
  // sair para o menu desliga a tela ligada
  await p.evaluate(() => { __calls.length = 0; G.UI.ACT.uxexit(); }); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => __calls.some(c => c[0] === 'tela' && c[1] === false)), 'voltar ao menu libera a tela (ligar=false)');
  console.log('erros de página:', errs.length ? errs : 'nenhum');
  await b.close();
})().catch(e => { console.error('FALHA', e); process.exit(1); });
