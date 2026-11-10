/* Partida longa no navegador: um robô simples joga em 3× enquanto capturamos telas.
   Uso: node tools/play3.js <pasta_saida> [segundos] */
const path = require('path'); const { chromium } = require('playwright');
(async () => {
  const out = process.argv[2] || '/tmp', secs = +process.argv[3] || 120;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errs = [];
  p.on('pageerror', (e) => errs.push('ERRO ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.join(__dirname, '..', 'aurora-cidade-viva-19.html'));
  await p.waitForTimeout(1500);
  await p.click('[data-a="t-new"]'); await p.waitForTimeout(900); await p.click('[data-a="tskip"]'); await p.waitForTimeout(300);
  await p.evaluate(() => {
    G.S.speed = 3; G.AUTO = true;
    window.__bot = setInterval(() => {
      const S = G.S; while (G.questCur().done) G.questClaim(); S.daily.list.forEach((c, i) => G.contractClaim(i)); G.dailyChest();
      for (const h of S.heroes) if (G.canPromote(h)) G.promote(h);
      const mt = G.forgeMaxTier();
      if (mt > 0) for (const h of S.heroes) { const c = G.CLASSES[h.cls]; for (const [slot, type] of [['arma', c.w], ['armadura', c.a], ['acessorio', 'anel']]) { const cur = h.gear[slot]; if (cur && cur.tier >= mt) continue; if (S.inv.some((i) => i.type === type && i.tier >= mt)) continue; if (G.canCraft(type, mt, false).ok) G.craft(type, mt, false, true); } }
      if (S.heroes.length < G.heroCap() && S.gold >= G.recruitCost() * 1.3) { G.spend(G.recruitCost(), 'recrutas'); G.hire(G.rollCandidates('gold')[0]); }
      for (const id of ['enfermaria', 'ferraria', 'pedreira', 'lenharia', 'alquimista', 'mercado', 'padaria', 'treino', 'torre', 'santuario']) if (G.bLvl(id) === 0 && G.canUpgrade(id).ok) { G.upgrade(id); return; }
      let best = null, bc = 1e18; for (const id of G.BLD_IDS) { if (!G.bLvl(id)) continue; const r = G.canUpgrade(id); if (r.ok && r.c.gold < bc && S.gold > r.c.gold * 1.4) { bc = r.c.gold; best = id; } } if (best) G.upgrade(best);
    }, 1500);
  });
  const views = [() => { G.R.follow = 0; G.R.focus(44, 52, true); }, () => { const h = G.S.heroes.find((x) => x.state === 'hunt') || G.S.heroes[0]; G.R.follow = h.id; }, () => { G.R.follow = 0; G.R.focus(66, 55, true); }, () => { const m = G.mons.find((x) => x.boss) || G.mons[0]; G.R.follow = 0; if (m) G.R.focus(m.x, m.y, true); }];
  const n = Math.floor(secs / 15);
  for (let i = 0; i < n; i++) {
    await p.evaluate((f) => eval('(' + f + ')()'), views[i % views.length].toString());
    await p.waitForTimeout(15000);
    await p.screenshot({ path: path.join(out, 'r-' + String(i + 1).padStart(2, '0') + '.png') });
    const st = await p.evaluate(() => ({ dia: G.S.day, h: G.clockStr(G.S.clock), reino: G.S.realm.lvl, ouro: Math.round(G.S.gold), lv: G.S.heroes.map((h) => h.lvl + G.RANKS[h.rank] + ':' + h.state.slice(0, 4)).join(' '), ab: G.S.stats.kills, q: G.S.stats.falls, jornada: G.S.quest.step, parts: G.R.parts.length, fx: G.R.fxs.length, mons: G.mons.length }));
    console.log(JSON.stringify(st));
  }
  console.log(errs.length ? [...new Set(errs)].slice(0, 10).join('\n') : 'sem erros');
  await b.close();
})();
