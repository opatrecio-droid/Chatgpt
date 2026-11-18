/* Menu inicial e Ajustes: sliders, remapeamento de teclas, ponte de opções com o jogo, Continuar.
   Uso: node verificacao/teste-menu.cjs [file:///caminho/www/index.html]  (sai com 1 se algo falhar) */
const { chromium } = require('playwright');
const URL = (process.argv[2] || 'file://' + require('node:path').resolve(__dirname, '../www/index.html'));
const FOTOS = process.env.AURORA_FOTOS || require('node:path').join(require('node:os').tmpdir(), 'aurora-teste-menu');
require('node:fs').mkdirSync(FOTOS, { recursive: true });
const foto = (nome) => require('node:path').join(FOTOS, nome);   // capturas de tela: fora do repositório
const ok = (c, m) => { if (!c) process.exitCode = 1; console.log((c ? 'PASS ' : 'FAIL ') + m); };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0, 300)));
  await p.goto(URL); await p.waitForSelector('.am-root', { timeout: 20000 });

  // 1) config antes do jogo: slider de música + qualidade + tecla de pausa
  await p.click('[data-a="am-config"]'); await p.waitForSelector('.am-modal');
  await p.screenshot({ path: foto('f-cfg-audio.png') });
  await p.$eval('input[data-cfg="audio.music"]', el => { el.value = 80; el.dispatchEvent(new Event('input', { bubbles: true })); });
  let cfg = await p.evaluate(() => JSON.parse(localStorage.getItem('aurora.config.v1')));
  ok(cfg.u['audio.music'] === 0.8, 'slider grava audio.music=0.8 → ' + JSON.stringify(cfg.u));
  await p.click('[data-a="am-aba:graficos"]'); await p.screenshot({ path: foto('f-cfg-graficos.png') });
  await p.click('[data-a="am-set:tela.qualidade:baixa"]');
  await p.click('[data-a="am-set:tela.dprCap:3"]');
  await p.click('[data-a="am-flip:tela.economiaBateria"]');
  await p.click('[data-a="am-aba:controles"]'); await p.screenshot({ path: foto('f-cfg-controles.png') });
  await p.click('[data-a="am-tecla:pausar"]');
  await p.keyboard.press('KeyP');
  cfg = await p.evaluate(() => JSON.parse(localStorage.getItem('aurora.config.v1')));
  ok(cfg.teclas.pausar === 'KeyP', 'tecla de pausa remapeada → ' + JSON.stringify(cfg.teclas));
  // conflito: velocidade2 -> KeyM (troca com mapa)
  await p.click('[data-a="am-tecla:velocidade2"]'); await p.keyboard.press('KeyM');
  cfg = await p.evaluate(() => JSON.parse(localStorage.getItem('aurora.config.v1')));
  ok(cfg.teclas.velocidade2 === 'KeyM' && cfg.teclas.mapa === 'Digit2', 'conflito troca teclas → ' + JSON.stringify(cfg.teclas));
  await p.click('[data-a="am-aba:acessibilidade"]'); await p.click('[data-a="am-set:interface.textScale:115"]'); await p.screenshot({ path: foto('f-cfg-acess.png') });
  await p.click('[data-a="am-aba:sobre"]'); await p.screenshot({ path: foto('f-cfg-sobre.png') });
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => !G.UI.modalOpen), 'Esc fecha a janela de configurações');

  // 2) iniciar campanha e conferir ponte de opções
  await p.click('[data-a="t-new"]'); await p.waitForTimeout(4500);
  const o = await p.evaluate(() => ({ ...G.S.opts }));
  ok(o.music === 0.8 && o.lowFx === 1 && o.dprCap === 3 && o.battery === true && o.textScale === 115, 'opções aplicadas ao jogo novo → ' + JSON.stringify({ music: o.music, lowFx: o.lowFx, dprCap: o.dprCap, battery: o.battery, textScale: o.textScale }));

  // 3) teclado remapeado dentro do jogo
  await p.evaluate(() => { G.S.tut.done = true; G.UI.closeAll && G.UI.closeAll(); G.UI.closeModal && G.UI.closeModal(); G.S.paused = false; });
  await p.waitForTimeout(300);
  await p.keyboard.press('KeyP'); await p.waitForTimeout(100);
  ok(await p.evaluate(() => G.S.paused === true), 'P (remapeado) pausa o jogo');
  await p.keyboard.press('Space'); await p.waitForTimeout(100);
  ok(await p.evaluate(() => G.S.paused === true), 'Espaço (tecla antiga) não despausa mais');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);   // Espaço num botão focado o aciona (comportamento do jogo): fecha o que abriu
  await p.keyboard.press('KeyP'); await p.waitForTimeout(100);
  ok(await p.evaluate(() => G.S.paused === false), 'P despausa');
  await p.keyboard.press('Digit3'); await p.waitForTimeout(100);
  ok(await p.evaluate(() => G.S.speed === 3), 'tecla 3 continua velocidade 3');
  await p.keyboard.press('KeyM'); await p.waitForTimeout(100);
  ok(await p.evaluate(() => G.S.speed === 2), 'M (agora velocidade 2) muda a velocidade para 2');
  await p.keyboard.press('Digit2'); await p.waitForTimeout(400);
  ok(await p.evaluate(() => G.UI.modalOpen), '2 (agora mapa) abre o mapa');
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);

  // 4) espelhamento: mudar opção dentro do jogo atualiza a config global
  await p.evaluate(() => { G.S.opts.sfx = 0.2; G.emit('opts'); });
  cfg = await p.evaluate(() => JSON.parse(localStorage.getItem('aurora.config.v1')));
  ok(cfg.u['audio.sfx'] === 0.2, 'mudança em jogo espelhada em aurora.config.v1 (sfx=0.2)');

  // 5) voltar ao menu → cartão Continuar com resumo
  await p.evaluate(() => G.M.save());
  await p.evaluate(() => G.UI.ACT.uxexit && G.UI.ACT.uxexit());
  await p.waitForSelector('.am-root .am-primary[data-a="t-continue"]', { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(1500);
  const temContinuar = await p.$('[data-a="t-continue"]');
  ok(!!temContinuar, 'menu volta com "Continuar jornada"');
  if (temContinuar) console.log('   resumo:', (await p.$eval('[data-a="t-continue"]', el => el.innerText)).replace(/\n+/g, ' | '));
  await p.screenshot({ path: foto('f-menu-continuar.png') });

  // 6) janelas Jornada e Como jogar
  await p.click('[data-a="am-jornada"]'); await p.waitForTimeout(200); await p.screenshot({ path: foto('f-jornada.png') });
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);
  await p.click('[data-a="am-comojogar"]'); await p.waitForTimeout(200); await p.screenshot({ path: foto('f-comojogar.png') });
  await p.keyboard.press('Escape'); await p.waitForTimeout(200);

  // 7) continuar jornada
  await p.click('[data-a="t-continue"]'); await p.waitForTimeout(3500);
  ok(await p.evaluate(() => G.M.running === true && !document.querySelector('#title').classList.contains('on')), 'Continuar entra no jogo e esconde o menu');
  await p.screenshot({ path: foto('f-jogo.png') });
  console.log('capturas de tela em', FOTOS);
  console.log('erros de página:', errs.length ? errs : 'nenhum');
  await b.close();
})().catch(e => { console.error('FALHA NO TESTE', e); process.exit(1); });
