// Capturas da "cidade viva" (portas, janelas e postes). Uso: node tools/cidade-shots.js <arquivo.html> <prefixo> [cenas...]
// Cenas: casas (as 6 variantes de dia/18h30/22h/madrugada), porta (moradores entrando e saindo, quadro a quadro),
//        postes (praça nas horas do crepúsculo e à noite), tudo (padrão). Opções por ambiente: LOWFX=1, QUIET=1, Z=6.
// Imprime "sem erros" quando a página não registrou nenhum erro.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [fileArg, out, ...sc] = process.argv.slice(2), scenes = sc.length ? sc : ['casas', 'porta', 'postes'];
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 430, height: 760 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
  await p.goto('file://' + path.resolve(fileArg)); await p.waitForFunction(() => window.G && G.UI && G.R, null, { timeout: 60000 });
  await p.waitForTimeout(400); await p.click('[data-a="t-new"]'); await p.waitForTimeout(1500);
  await p.evaluate(([lf, q]) => {
    G.UI.closeModal(); G.UI.close(); G.R.follow = 0; G.S.opts.lowFx = !!lf; G.S.opts.reduceMotion = !!q;
    G.syncNpcs && G.syncNpcs();
    for (const n of G.npcs) { n.tThink = 1e9; n.inside = true; n.act = 'home'; n.state = 'home'; const d = G.W.houses[n.home].door; n.x = d[0]; n.y = d[1]; }   // ninguém decide sozinho nas fotos
    window.__clk = null;
    setInterval(() => { if (window.__clk != null) G.S.clock = window.__clk; }, 30);
  }, [process.env.LOWFX, process.env.QUIET]);
  const Z = +(process.env.Z || 6);
  const clock = h => p.evaluate(h => { window.__clk = h * 60; G.S.clock = h * 60; }, h);
  const focus = (x, y, z) => p.evaluate(([x, y, z]) => { G.R.focus(x, y, true); G.R.cam.zf = z; G.R.cam.z = z; }, [x, y, z]);
  const clip = { x: 15, y: 150, width: 400, height: 460 };
  const shot = (name, c) => p.screenshot({ path: out + '-' + name + '.png', clip: c || clip });
  const homeAll = () => p.evaluate(() => { for (const n of G.npcs) { n.inside = true; n.act = 'home'; n.state = 'home'; n.tThink = 1e9; const d = G.W.houses[n.home].door; n.x = d[0]; n.y = d[1]; } });
  const away = () => p.evaluate(() => { for (const n of G.npcs) { n.inside = false; n.act = 'leisure'; n.state = 'stand'; n.tThink = 1e9; n.x = 44 + (n.home % 5); n.y = 54; } });

  if (scenes.includes('casas')) {
    for (const hi of [0, 1, 2, 3, 4, 5]) {
      await focus(G_H(hi)[0] + 2, G_H(hi)[1] + 1.4, Z);
      await clock(11); await homeAll(); await p.waitForTimeout(500); await shot('casa' + hi + '-dia');
      await clock(18.5); await away(); await p.waitForTimeout(700); await shot('casa' + hi + '-1830');
      await clock(22); await homeAll(); await p.waitForTimeout(2500); await shot('casa' + hi + '-22h');
      await clock(2.4); await p.waitForTimeout(1800); await shot('casa' + hi + '-madrugada');
    }
  }
  if (scenes.includes('porta')) {
    const hi = +(process.env.H || 0), h = await p.evaluate(hi => G.W.houses[hi].door, hi);
    for (const hour of [11, 22]) {
      await focus(h[0], h[1] - 1.3, Z); await clock(hour); await homeAll(); await p.waitForTimeout(500);
      // saída: o morador está dentro, vira "fora" na porta e caminha para longe
      await p.evaluate(hi => { const n = G.npcs.find(n => n.home === hi); n.inside = false; n.act = 'leisure'; n.goal = 'stand'; n.state = 'walk'; n.moving = true; G.go(n, n.x + 3, n.y + 4); window.__n = n; }, hi);
      for (let i = 0; i < 8; i++) { await shot('porta-' + hour + 'h-sai' + i, { x: 80, y: 220, width: 270, height: 330 }); await p.waitForTimeout(110); }
      // volta: anda até a porta e entra (+ um segundo morador logo depois: porta fica aberta)
      await p.evaluate(hi => { const ns = G.npcs.filter(n => n.home === hi); const d = G.W.houses[hi].door; ns.slice(0, 2).forEach((n, k) => { n.inside = false; n.act = 'home'; n.goal = 'in'; n.state = 'walk'; n.moving = true; n.x = d[0] - 1.2 + k * 2.2; n.y = d[1] + 1.5 + k * 0.5; G.go(n, d[0], d[1]); }); }, hi);
      for (let i = 0; i < 14; i++) { await shot('porta-' + hour + 'h-entra' + i, { x: 80, y: 220, width: 270, height: 330 }); await p.waitForTimeout(140); }
    }
  }
  if (scenes.includes('postes')) {
    await focus(44, 53.6, Math.min(Z, 4));
    for (const [h, nm] of [[12, 'dia'], [18.3, 'a1830'], [18.7, 'a1842'], [19.2, 'a1912'], [20.5, 'a2030'], [22, 'a22h'], [5.5, 'b0530'], [6.2, 'b0612']]) {
      await clock(h); await homeAll(); await p.waitForTimeout(700); await shot('postes-' + nm, { x: 0, y: 130, width: 430, height: 520 });
    }
    await focus(44, 46.5, 8); await clock(22); await p.waitForTimeout(500); await shot('poste-perto', { x: 40, y: 150, width: 350, height: 420 });
    for (let i = 0; i < 3; i++) { await p.waitForTimeout(260); await shot('poste-perto' + i, { x: 40, y: 150, width: 350, height: 420 }); }
  }
  console.log('prims', await p.evaluate(() => JSON.stringify(G.A.cidadeViva && G.A.cidadeViva().prims)));
  console.log(errs.slice(0, 10).join('\n') || 'sem erros'); await b.close();
  function G_H(i) { return HOUSES[i]; }
})();
const HOUSES = [[62, 38], [62, 65], [67, 65], [54, 70], [31, 70], [50, 36], [35, 36], [36, 70]];
