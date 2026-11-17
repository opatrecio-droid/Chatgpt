// Abre a janela "Enquanto você esteve fora" com dados de exemplo e cartas de todas as raridades.
// Uso: node tools/return-shots.js <arquivo.html> <prefixo> [largura=430] [altura=860] [acoes]
//   acoes (separadas por vírgula): flip0..flip7 (vira a carta i), all (Virar todas), tab:<nome> (clica na aba cujo
//   texto contém <nome>), wait<ms>. Cada ação gera um PNG <prefixo>-<n>-<acao>.png; o estado inicial é <prefixo>-0.png.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [fileArg, out, wArg, hArg, actsArg] = process.argv.slice(2);
  const W = Number(wArg || 430), H = Number(hArg || 860), acts = (actsArg || '').split(',').filter(Boolean);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 300)); });
  await page.goto('file://' + path.resolve(fileArg));
  await page.waitForFunction(() => window.G && G.M && G.UI && G.UI.ACT, null, { timeout: 60000 });
  await page.waitForTimeout(400);
  await page.click('[data-a="t-new"]');
  await page.waitForTimeout(1500);
  await page.evaluate(() => {
    G.UI.closeModal();
    const res = Object.keys(G.RES).filter(k => !/^(tomo|alma|po_estelar|emb)/.test(k)).slice(0, 6).map((id, i) => ({ id, n: [1524, 128, 254, 96, 111, 244][i] }));
    const o = { raw: 12 * 3600 + 32 * 60, secs: 12 * 3600, eff: 5 * 3600 + 21 * 60, sim: 33 * 60, est: 4 * 3600 + 48 * 60, days: 6, gold: -1200, kills: 13300, lvls: 27, items: 0, falls: 3, res,
      heroes: G.S.heroes.map(h => ({ n: h.name, up: 9, lvl: 10 })), realm: 2, contr: 2, sys: ['Artes Secretas', 'Caminhos', 'Contratos', 'Bestiário'], autoDec: 2,
      notable: ['Mira derrubou Ancião da Matilha! +1 Selo de Renome. A corrupção da zona subiu para II: monstros mais fortes, espólio melhor.', 'Códex: "Primeiro Épico". Recompensa: 1 Núcleo(s).', 'Tobo derrubou Ancião da Matilha! +1 Selo de Renome.', 'Códex: "Primeiro Lendário". Recompensa: 2 Núcleo(s), 1 Selo(s).', 'Uma nova região pode ser explorada: Ruínas de Ocre.'] };
    G.retFinish();
    const kinds = ['gold', 'mat', 'cons', 'nuc', 'selo', 'po', 'gold', 'mat'], rars = [0, 1, 2, 2, 3, 3, 4, 4];
    const cards = G.retRollCards(8 * 3600).slice(0, 8);
    while (cards.length < 8) cards.push({ k: 'gold', r: 0, p: { gold: 100 }, st: 0 });
    cards.forEach((c, i) => { if (c.k !== 'gear') { c.k = kinds[i]; c.r = rars[i]; c.p = kinds[i] === 'gold' ? { gold: 500 * (i + 1) } : kinds[i] === 'nuc' ? { nucleos: 2 } : kinds[i] === 'selo' ? { selos: 2 } : kinds[i] === 'po' ? { res: { po_reforja: 6 } } : { res: { [res[i % res.length].id]: 40 * (i + 1) } }; } });
    // uma peça Mítica para mostrar a raridade máxima
    try { const g = G.rollGift(); g.rar = 5; cards[7] = { k: 'gear', r: 5, p: { it: g }, st: 0 }; } catch (e) { cards[7].r = 4; }
    G.ret().off = Object.assign({}, o, { cards }); o.cards = cards;
    G.UI.offlineModal(o);
  });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: out + '-0.png' });
  let n = 1;
  for (const a of acts) {
    if (/^flip\d+$/.test(a)) await page.evaluate(i => { const el = document.querySelector('#rc' + i); if (el) el.click(); }, Number(a.slice(4)));
    else if (a === 'all') await page.evaluate(() => { const b = document.querySelector('#rtall'); if (b) b.click(); });
    else if (a.startsWith('tab:')) await page.evaluate(t => { const b = [...document.querySelectorAll('#modal [role="tab"], #modal [data-tab], #modal button')].find(x => x.textContent.toLowerCase().includes(t.toLowerCase())); if (b) b.click(); }, a.slice(4));
    else if (a.startsWith('wait')) { await page.waitForTimeout(Number(a.slice(4))); continue; }
    await page.waitForTimeout(900);
    await page.screenshot({ path: out + '-' + n + '-' + a.replace(/[^a-z0-9]/gi, '') + '.png' });
    n++;
  }
  const info = await page.evaluate(() => { const box = document.querySelector('#modal .mbox'); const sc = box && [...box.querySelectorAll('*')].filter(e => e.scrollHeight > e.clientHeight + 4 && getComputedStyle(e).overflowY !== 'visible').map(e => (e.className || e.tagName) + ':' + (e.scrollHeight - e.clientHeight)); return { open: !!box, scrollers: sc }; });
  console.log(JSON.stringify(info));
  console.log(errors.slice(0, 10).join('\n') || 'sem erros');
  await browser.close();
})();
