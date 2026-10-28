// Detalhe da classe: modal em tela cheia, páginas (habilidades, passivas, frascos), bônus de atributos e desbloqueio segurando o botão.
const fs = require('fs'), path = require('path');
const { abrir, foto, RAIZ } = require('./lib');
const afirma = (ok, msg) => { if (!ok) { console.log('FALHOU:', msg); process.exitCode = 1; } };
(async () => {
  const saida = path.join(RAIZ, 'tests', 'saida'); fs.mkdirSync(saida, { recursive: true });
  const { browser, page, erros } = await abrir({});
  await page.evaluate(() => { S.lvl = 17; S.ess = 100000; save(); openPanel('classes'); });
  await page.waitForTimeout(900);

  // árvore confirmada pelo vídeo: nomes e ordem dos híbridos
  const arvore = await page.evaluate(() => Object.fromEntries(Object.keys(PATHS).map(p => [p, PATHS[p].tiers.map(t => t.map(k => classNome(k)))])));
  console.log(JSON.stringify(arvore));
  afirma(arvore.ladino.flat().join('|') === 'Gatuno|Ladino|Feiticeiro das Sombras|Místico|Adepto|Majestoso|Feiticeiro das Sombras|Magistrado|Arquidruida|Arcânico|Nyx|Viajante de Domínios', 'Ladrão: nomes/ordem');
  afirma(arvore.mago.flat().join('|') === 'Mago|Arquimago|Mago da Corte|Mago-Espadachim|Místico|Druida|Tecelão de Feitiços|Arquidruida|Paladino|Necromante|Ominimante|Herege', 'Mago: nomes/ordem');

  // bônus de atributos do vídeo (herói nível 17): Mago = HP −105, Mana +81, Atq −5, Mag +19, Def −9, Res +8
  const linha = await page.evaluate(() => { openModal(mClass, 'mago'); modal.classList.add('cd-full'); return document.querySelector('.cd-st')?.textContent; });
  console.log('Mago:', linha);
  afirma(/HP −105/.test(linha) && /Mana \+81/.test(linha) && /Atq −5/.test(linha) && /Mag \+19/.test(linha) && /Def −9/.test(linha) && /Res \+8/.test(linha), 'linha de bônus do Mago nível 17');
  await page.waitForTimeout(500); await foto(page, path.join(saida, 'classe-detalhe-mago.png'));
  afirma(await page.locator('.cd-hold').count() === 1, 'botão de segurar para desbloquear');
  afirma(/2\.500|2,500/.test(await page.locator('.cd-cost').innerText()) || /orns/.test(await page.locator('.cd-cost').innerText()), 'custo em orns');

  // páginas
  for (const [k, nome] of [['c_4', 'arquimago'], ['c_5', 'ladino'], ['c_52', 'ominimante']]) {
    await page.evaluate(k => { openModal(mClass, k); modal.classList.add('cd-full'); }, k); await page.waitForTimeout(300);
    for (const p of ['skills', 'passives', 'flasks']) {
      if (p === 'flasks' && !await page.locator('.cd-b.wide').count()) continue;
      await page.locator(`.cd-b[data-p="${p}"]`).first().click().catch(() => page.locator(`.cd-tab[data-p="${p}"]`).click());
      await page.waitForTimeout(300);
      const n = await page.locator('.cd-it').count(); afirma(n > 0, `${nome}/${p}: lista vazia`);
      if (k !== 'c_52') await foto(page, path.join(saida, `classe-${nome}-${p}.png`));
      await page.evaluate(k => { M.args = [k, 'info']; mBody.innerHTML = mClass(k, 'info'); }, k);
    }
  }
  const lista = await page.evaluate(() => { mBody.innerHTML = mClass('c_5', 'skills'); return [...document.querySelectorAll('.cd-it')].map(e => e.innerText.replace(/\n+/g, ' | ')); });
  console.log(lista.slice(0, 3));
  afirma(/Nível 25/.test(lista[0]) && /Poder: \d/.test(lista[0]), 'Peregrino/Ladino: habilidade com nível e poder');
  // textos reais do vídeo (não os montados do catálogo)
  afirma(/Ataque com chance de envenenamento\./.test(lista[0]), 'Golpe Venenoso usa o texto do jogo: ' + lista[0]);
  const reais = await page.evaluate(() => ({ n: Object.keys(window.TEXTO_HAB).length, p: Object.keys(window.TEXTO_PASSIVA).length, avidez: (() => { mBody.innerHTML = mClass('c_5', 'passives'); return document.querySelector('.cd-it p')?.textContent; })(),
    mago: (() => { mBody.innerHTML = mClass('c_87', 'skills'); return [...document.querySelectorAll('.cd-it p')].filter(p => /Invoque|Evoque/.test(p.textContent)).length; })() }));
  console.log(JSON.stringify(reais));
  afirma(reais.n > 250 && reais.p > 50, 'tabelas de textos carregadas');
  afirma(/turno adicional/.test(reais.avidez), 'passiva Avidez com texto do jogo');

  // desbloquear segurando: solta antes de 1 s não compra; segura 1,3 s compra
  await page.evaluate(() => { closeModal(); openModal(mClass, 'mago'); modal.classList.add('cd-full'); }); await page.waitForTimeout(300);
  const antes = await page.evaluate(() => S.ess);
  await page.evaluate(() => document.querySelector('.cd-hold').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 })));
  await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelector('.cd-hold').dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 })));
  await page.waitForTimeout(900);
  afirma(await page.evaluate(() => !S.classes.includes('mago')) && await page.evaluate(e => S.ess === e, antes), 'soltar cedo não desbloqueia');
  await page.evaluate(() => document.querySelector('.cd-hold').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 1 })));
  await page.waitForTimeout(1500);
  afirma(await page.evaluate(() => S.classes.includes('mago')), 'segurar desbloqueia');
  afirma(await page.evaluate(() => modal.hidden && !modal.classList.contains('cd-full')), 'modal fecha e perde a classe cd-full');
  console.log(JSON.stringify({ erros }));
  afirma(!erros.length, 'erros de página');
  await browser.close();
})();
