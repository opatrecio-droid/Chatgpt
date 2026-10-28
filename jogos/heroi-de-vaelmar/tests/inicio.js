// Começo da aventura: o vídeo 1 mostra a «Cidade de Origem» como cidade do herói e a missão «Encontre Escudeiro Samson em Loton.»
const fs = require('fs'), path = require('path');
const { abrir, foto, RAIZ } = require('./lib');
const afirma = (ok, msg) => { if (!ok) { console.log('FALHOU:', msg); process.exitCode = 1; } };
(async () => {
  const saida = path.join(RAIZ, 'tests', 'saida'); fs.mkdirSync(saida, { recursive: true });
  const { browser, page, erros } = await abrir({});
  const r = await page.evaluate(() => {
    const o = POI.origin, c = poiPx(o), t = tileOf(H.x, H.y);
    return { cur, dist: Math.round(Math.hypot(H.x - c.x, H.y - c.y)), distLoton: Math.round(Math.hypot(H.x - poiPx(POI.loton).x, H.y - poiPx(POI.loton).y)),
      andavel: walkTile(...t), lastTown: S.lastTown, visited: Object.keys(S.visited), pos: S.pos, nome: o.n, rotulo: KIND_LBL.origin,
      missao: document.querySelector('#world-quest').textContent, area: document.querySelector('#w-zone').textContent };
  });
  console.log(JSON.stringify(r));
  await page.waitForTimeout(600); await foto(page, path.join(saida, 'inicio-origem.png'));
  afirma(r.cur === 'world' && r.dist < 40, 'a aventura nova começa junto da Cidade de Origem: ' + r.dist);
  afirma(r.distLoton > 150, 'e não em Loton: ' + r.distLoton);
  afirma(r.andavel, 'o herói começa em chão por onde se anda');
  afirma(r.lastTown === 'origin' && r.visited.join() === 'origin', 'ponto de despertar e cidades visitadas: ' + r.lastTown + ' ' + r.visited);
  afirma(r.nome === 'Cidade de Origem', 'nome em português: ' + r.nome);
  afirma(r.missao === 'Encontre Escudeiro Samson em Loton.', 'primeira missão: ' + r.missao);

  // derrota: acorda na cidade de origem
  const d = await page.evaluate(() => { const c = poiPx(POI.origin); H.x = c.x + 600; H.y = c.y; afterBattle('lose'); return { dist: Math.round(Math.hypot(H.x - c.x, H.y - c.y)) }; });
  afirma(d.dist < 40, 'depois de uma derrota o herói acorda na cidade de origem: ' + d.dist);
  // salvar e retomar mantém o ponto de despertar
  await page.evaluate(() => save()); await page.reload(); await page.waitForTimeout(2500);
  await page.getByText('Continuar', { exact: true }).first().tap(); await page.waitForTimeout(2000);
  const c = await page.evaluate(() => ({ lastTown: S.lastTown, missao: document.querySelector('#world-quest').textContent }));
  afirma(c.lastTown === 'origin', 'o save guarda a cidade de origem como ponto de despertar: ' + c.lastTown);
  // depois de falar com Samson a missão passa a ser a da história
  const s = await page.evaluate(() => { S.questFlags.samsonIntroduction = true; updateHUD(); return document.querySelector('#world-quest').textContent; });
  afirma(s !== 'Encontre Escudeiro Samson em Loton.' && /·/.test(s), 'com Samson visitado a linha volta à missão da história: ' + s);
  console.log(JSON.stringify({ erros })); afirma(!erros.length, 'erros de página');
  await browser.close();
})();
