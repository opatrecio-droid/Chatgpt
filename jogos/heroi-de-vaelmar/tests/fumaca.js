// Teste de fumaça: anda, luta, abre todas as telas e procura erros de execução. Uso: node tests/fumaca.js [largura] [altura]
const { abrir, foto } = require('./lib');
(async () => {
  const largura = +process.argv[2] || 393, altura = +process.argv[3] || 851;
  const { browser, page, erros, rede } = await abrir({ largura, altura });
  const consoleErros = []; page.on('console', m => { if (m.type() === 'error') consoleErros.push(m.text()); });
  const paineis = ['main', 'items', 'quests', 'codex', 'map'];
  let lutas = 0, passos = 0;
  for (let rodada = 0; rodada < 6; rodada++) {
    // anda por pontos aleatórios perto do herói
    for (let i = 0; i < 6; i++) {
      await page.evaluate(() => { const a = Math.random() * 6.283, d = 80 + Math.random() * 220; onTapWorld({ clientX: innerWidth / 2 + Math.cos(a) * d, clientY: innerHeight / 2 + Math.sin(a) * d }); });
      await page.waitForTimeout(500); passos++;
    }
    // luta com o monstro mais próximo
    const ok = await page.evaluate(() => { const m = EX.mons.slice().sort((a, b) => Math.hypot(a.x - H.x, a.y - H.y) - Math.hypot(b.x - H.x, b.y - H.y))[0]; if (!m) return false; H.x = m.x - 30; H.y = m.y; H.path = []; window.__b = startMapBattle(m); return true; });
    if (ok) {
      await page.waitForTimeout(1800); await page.evaluate(() => { try { ACT.encounterfight(); } catch {} }); await page.waitForTimeout(2200);
      for (let t = 0; t < 40; t++) {
        const cur = await page.evaluate(() => cur); if (cur === 'world') break;
        const res = page.locator('button[data-act="resultcontinue"]');
        if (await res.count() && await res.first().isVisible()) { await res.first().evaluate(b => b.click()); await page.waitForTimeout(900); continue; }
        const atk = page.locator('#cmds .bt-cmd:not([disabled])', { hasText: /ataque/i });
        if (await atk.count()) { await atk.first().evaluate(b => b.click()); await page.waitForTimeout(250); const l = page.locator('#cmds.list .bt-cmd:not([disabled])').first(); if (await l.count()) await l.evaluate(b => b.click()); }
        await page.waitForTimeout(800);
      }
      lutas++;
    }
    // abre cada painel
    for (const p of paineis) { await page.evaluate(n => { const b = document.querySelector('[data-open="' + n + '"]'); if (b) b.click(); }, p); await page.waitForTimeout(500); await page.evaluate(() => { try { closePanel(); } catch {} }); await page.waitForTimeout(200); }
    for (const [k, t] of [['hero', 'status'], ['hero', 'equip'], ['hero', 'inv'], ['classes'], ['skills'], ['settings'], ['rewards']]) { await page.evaluate(([k, t]) => { try { openPanel(k, t); } catch (e) { throw e; } }, [k, t]); await page.waitForTimeout(400); await page.evaluate(() => closePanel()); }
  }
  await foto(page, '/tmp/claude-0/-home-user-Chatgpt/79e18f0c-8b9e-5865-8192-07f23545b9fb/scratchpad/fumaca.png');
  const fim = await page.evaluate(() => ({ cur, lvl: S.lvl, xp: S.xp, hp: S.hp }));
  console.log(JSON.stringify({ largura, altura, lutas, passos, fim, erros, consoleErros: consoleErros.slice(0, 5), rede }));
  await browser.close();
  process.exit(erros.length || consoleErros.length ? 1 : 0);
})();
