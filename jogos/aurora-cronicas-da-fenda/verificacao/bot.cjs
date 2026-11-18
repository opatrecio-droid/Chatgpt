/* Simula N dias com o robô de ensaio embutido (G.debugBot, em worker) em 6 cenários fixos e grava um hash por cenário.
   Uso: node verificacao/bot.cjs file:///caminho/www/index.html saida.json [dias]. Rode antes/depois e compare os hashes. */
const { chromium } = require('playwright'); const { createHash } = require('node:crypto');
const [url, out, dias = '30'] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 800, height: 450 } })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 200)));
  await p.goto(url); await p.waitForFunction(() => window.G && G.debugBot, null, { timeout: 30000 });
  const res = [];
  const casos = [['normal', 271, []], ['facil', 7, []], ['dificil', 99, ['obra-prima', 'nucleos-obras']], ['pesadelo', 5, ['preparo-situacional']], ['parado', 271, []], ['normal', 12345, ['obra-prima', 'nucleos-obras', 'preparo-situacional', 'jornada-fenda']]];
  for (const [modo, seed, systems] of casos) {
    const t0 = Date.now();
    const r = await p.evaluate(async ([d, m, o]) => { try { const r = await G.debugBot(d, m, o); delete r.elapsedMs; return JSON.stringify(r); } catch (e) { return 'ERRO ' + e.message; } }, [+dias, modo, { seed, fresh: true, systems }]);
    const h = createHash('sha256').update(r).digest('hex').slice(0, 16);
    res.push({ modo, seed, systems: systems.join('+'), len: r.length, hash: h, head: r.slice(0, 90), seg: ((Date.now() - t0) / 1000) | 0 });
    console.log(modo, seed, h, r.length, r.startsWith('ERRO') ? r : '', ((Date.now() - t0) / 1000) | 0, 's');
  }
  require('node:fs').writeFileSync(out, JSON.stringify({ res, errs }, null, 1));
  await b.close();
})().catch((e) => { console.error('FALHA', e); process.exit(1); });
