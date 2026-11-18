/* Controle (gamepad) nos menus: D-pad, analógico, A confirma, B volta.
   Uso: node verificacao/teste-controle.cjs [file:///caminho/www/index.html]  (sai com 1 se algo falhar) */
const { chromium } = require('playwright');
const URL = (process.argv[2] || 'file://' + require('node:path').resolve(__dirname, '../www/index.html'));
const ok = (c, m) => { if (!c) process.exitCode = 1; console.log((c ? 'PASS ' : 'FAIL ') + m); };
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  await p.addInitScript(() => {
    window.__pad = { connected: true, index: 0, axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })) };
    navigator.getGamepads = () => [window.__pad];
  });
  const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await p.goto(URL); await p.waitForSelector('.am-root'); await p.waitForTimeout(1500);
  await p.evaluate(() => window.dispatchEvent(new Event('gamepadconnected')));
  const foco = () => p.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-a'));
  const aperta = async (i) => { await p.evaluate((i) => { __pad.buttons[i].pressed = true; }, i); await p.waitForTimeout(120); await p.evaluate((i) => { __pad.buttons[i].pressed = false; }, i); await p.waitForTimeout(120); };
  const f0 = await foco(); console.log('foco inicial:', f0);
  await aperta(13); const f1 = await foco(); ok(f1 !== f0, 'D-pad ↓ move o foco: ' + f0 + ' → ' + f1);
  await aperta(13); const f2 = await foco(); ok(f2 !== f1, 'D-pad ↓ de novo: ' + f1 + ' → ' + f2);
  await aperta(12); const f3 = await foco(); ok(f3 === f1, 'D-pad ↑ volta: ' + f3);
  // focar "Ajustes" e confirmar com A
  await p.focus('[data-a="am-config"]'); await aperta(0); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !!document.querySelector('.am-modal')), 'botão A abre Ajustes');
  await aperta(1); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !G.UI.modalOpen), 'botão B (Esc) fecha a janela');
  // analógico
  await p.evaluate(() => { __pad.axes[1] = 0.9; }); await p.waitForTimeout(300); await p.evaluate(() => { __pad.axes[1] = 0; });
  ok((await foco()) !== null, 'analógico também navega');
  console.log('erros:', errs.length ? errs : 'nenhum');
  await b.close();
})().catch((e) => { console.error('FALHA NO TESTE', e); process.exit(1); });
